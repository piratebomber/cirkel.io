import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';

export interface DecentralizedIdentity {
  did: string;
  publicKey: string;
  verificationMethods: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase: string;
  }>;
  services: Array<{
    id: string;
    type: string;
    serviceEndpoint: string;
  }>;
  credentials: VerifiableCredential[];
  createdAt: string;
  updatedAt: string;
}

export interface VerifiableCredential {
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: Record<string, any>;
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws: string;
  };
}

export interface IdentityVerification {
  id: string;
  userId: string;
  verificationType: 'email' | 'phone' | 'social' | 'government' | 'biometric';
  status: 'pending' | 'verified' | 'rejected';
  verificationData: Record<string, any>;
  verifiedAt?: string;
  expiresAt?: string;
}

export class DecentralizedIdentityService {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  private provider: ethers.providers.JsonRpcProvider;
  private identityContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    this.identityContract = new ethers.Contract(
      process.env.IDENTITY_CONTRACT_ADDRESS!,
      this.getIdentityContractABI(),
      this.provider
    );
  }

  async createDID(userId: string, seed?: Uint8Array): Promise<DecentralizedIdentity> {
    // Generate or use provided seed
    const keySeed = seed || ethers.utils.randomBytes(32);
    
    // Create DID provider
    const provider = new Ed25519Provider(keySeed);
    const did = new DID({ provider, resolver: getResolver() });
    
    // Authenticate the DID
    await did.authenticate();
    
    const didDocument = did.id;
    const publicKey = ethers.utils.hexlify(keySeed);

    // Create DID document
    const identity: DecentralizedIdentity = {
      did: didDocument,
      publicKey,
      verificationMethods: [{
        id: `${didDocument}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: didDocument,
        publicKeyMultibase: ethers.utils.base58.encode(provider.keyPair.publicKey)
      }],
      services: [{
        id: `${didDocument}#cirkel-profile`,
        type: 'CirkelProfile',
        serviceEndpoint: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${userId}`
      }],
      credentials: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in database
    await this.supabase
      .from('decentralized_identities')
      .insert({
        user_id: userId,
        did: didDocument,
        public_key: publicKey,
        verification_methods: identity.verificationMethods,
        services: identity.services,
        created_at: identity.createdAt,
        updated_at: identity.updatedAt
      });

    // Register on blockchain
    await this.registerDIDOnChain(didDocument, publicKey);

    return identity;
  }

  async issueVerifiableCredential(
    issuerDID: string,
    subjectDID: string,
    credentialType: string,
    claims: Record<string, any>,
    expirationDate?: string
  ): Promise<VerifiableCredential> {
    const credentialId = `vc:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    
    const credential: VerifiableCredential = {
      id: credentialId,
      type: ['VerifiableCredential', credentialType],
      issuer: issuerDID,
      issuanceDate: new Date().toISOString(),
      expirationDate,
      credentialSubject: {
        id: subjectDID,
        ...claims
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: `${issuerDID}#key-1`,
        proofPurpose: 'assertionMethod',
        jws: '' // Will be filled by signing
      }
    };

    // Sign the credential
    const signature = await this.signCredential(credential, issuerDID);
    credential.proof.jws = signature;

    // Store credential
    await this.supabase
      .from('verifiable_credentials')
      .insert({
        id: credentialId,
        issuer_did: issuerDID,
        subject_did: subjectDID,
        credential_type: credentialType,
        credential_data: credential,
        issued_at: credential.issuanceDate,
        expires_at: expirationDate,
        created_at: new Date().toISOString()
      });

    return credential;
  }

  async verifyCredential(credential: VerifiableCredential): Promise<boolean> {
    try {
      // Verify signature
      const isSignatureValid = await this.verifyCredentialSignature(credential);
      if (!isSignatureValid) return false;

      // Check expiration
      if (credential.expirationDate) {
        const now = new Date();
        const expiration = new Date(credential.expirationDate);
        if (now > expiration) return false;
      }

      // Verify issuer DID exists and is valid
      const issuerExists = await this.verifyDIDExists(credential.issuer);
      if (!issuerExists) return false;

      // Check if credential is revoked
      const isRevoked = await this.isCredentialRevoked(credential.id);
      if (isRevoked) return false;

      return true;
    } catch (error) {
      console.error('Credential verification failed:', error);
      return false;
    }
  }

  async revokeCredential(credentialId: string, issuerDID: string, reason: string): Promise<void> {
    // Verify issuer has authority to revoke
    const { data: credential } = await this.supabase
      .from('verifiable_credentials')
      .select('*')
      .eq('id', credentialId)
      .eq('issuer_did', issuerDID)
      .single();

    if (!credential) {
      throw new Error('Credential not found or issuer unauthorized');
    }

    // Add to revocation list
    await this.supabase
      .from('credential_revocations')
      .insert({
        credential_id: credentialId,
        issuer_did: issuerDID,
        reason,
        revoked_at: new Date().toISOString()
      });

    // Update blockchain revocation registry
    await this.addToRevocationRegistry(credentialId);
  }

  async createIdentityVerification(
    userId: string,
    verificationType: IdentityVerification['verificationType'],
    verificationData: Record<string, any>
  ): Promise<string> {
    const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const verification: IdentityVerification = {
      id: verificationId,
      userId,
      verificationType,
      status: 'pending',
      verificationData,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    await this.supabase
      .from('identity_verifications')
      .insert({
        id: verificationId,
        user_id: userId,
        verification_type: verificationType,
        status: 'pending',
        verification_data: verificationData,
        expires_at: verification.expiresAt,
        created_at: new Date().toISOString()
      });

    // Process verification based on type
    await this.processVerification(verification);

    return verificationId;
  }

  async completeVerification(verificationId: string, approved: boolean, notes?: string): Promise<void> {
    const status = approved ? 'verified' : 'rejected';
    const verifiedAt = approved ? new Date().toISOString() : undefined;

    await this.supabase
      .from('identity_verifications')
      .update({
        status,
        verified_at: verifiedAt,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', verificationId);

    if (approved) {
      // Issue verifiable credential for successful verification
      const { data: verification } = await this.supabase
        .from('identity_verifications')
        .select('*, users(did)')
        .eq('id', verificationId)
        .single();

      if (verification && verification.users?.did) {
        await this.issueVerifiableCredential(
          process.env.CIRKEL_ISSUER_DID!,
          verification.users.did,
          `${verification.verification_type}Verification`,
          {
            verificationType: verification.verification_type,
            verifiedAt: verifiedAt,
            platform: 'cirkel.io'
          }
        );
      }
    }
  }

  async getUserDID(userId: string): Promise<DecentralizedIdentity | null> {
    const { data } = await this.supabase
      .from('decentralized_identities')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!data) return null;

    // Get associated credentials
    const { data: credentials } = await this.supabase
      .from('verifiable_credentials')
      .select('credential_data')
      .eq('subject_did', data.did);

    return {
      did: data.did,
      publicKey: data.public_key,
      verificationMethods: data.verification_methods,
      services: data.services,
      credentials: credentials?.map(c => c.credential_data) || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async getUserVerifications(userId: string): Promise<IdentityVerification[]> {
    const { data } = await this.supabase
      .from('identity_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return data?.map(v => ({
      id: v.id,
      userId: v.user_id,
      verificationType: v.verification_type,
      status: v.status,
      verificationData: v.verification_data,
      verifiedAt: v.verified_at,
      expiresAt: v.expires_at
    })) || [];
  }

  async linkSocialAccount(
    userId: string,
    platform: 'twitter' | 'github' | 'linkedin',
    accountData: Record<string, any>
  ): Promise<void> {
    // Create verification for social account
    await this.createIdentityVerification(userId, 'social', {
      platform,
      ...accountData
    });
  }

  async generateProof(
    userDID: string,
    claims: string[],
    verifierDID: string
  ): Promise<any> {
    // Generate zero-knowledge proof for selective disclosure
    const { data: identity } = await this.supabase
      .from('decentralized_identities')
      .select('*')
      .eq('did', userDID)
      .single();

    if (!identity) throw new Error('DID not found');

    // Get relevant credentials
    const { data: credentials } = await this.supabase
      .from('verifiable_credentials')
      .select('credential_data')
      .eq('subject_did', userDID);

    // Create selective disclosure proof
    const proof = {
      type: 'SelectiveDisclosureProof',
      created: new Date().toISOString(),
      verificationMethod: `${userDID}#key-1`,
      proofPurpose: 'authentication',
      challenge: ethers.utils.randomBytes(32),
      domain: verifierDID,
      disclosedClaims: claims,
      credentials: credentials?.map(c => c.credential_data) || []
    };

    return proof;
  }

  private async registerDIDOnChain(did: string, publicKey: string): Promise<void> {
    try {
      const signer = new ethers.Wallet(process.env.IDENTITY_PRIVATE_KEY!, this.provider);
      const contract = this.identityContract.connect(signer);
      
      const tx = await contract.registerDID(did, publicKey);
      await tx.wait();
    } catch (error) {
      console.error('Failed to register DID on chain:', error);
    }
  }

  private async signCredential(credential: VerifiableCredential, issuerDID: string): Promise<string> {
    // Get issuer's private key (in production, use secure key management)
    const privateKey = process.env.ISSUER_PRIVATE_KEY!;
    const wallet = new ethers.Wallet(privateKey);
    
    // Create credential hash
    const credentialHash = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(JSON.stringify(credential))
    );
    
    // Sign the hash
    const signature = await wallet.signMessage(ethers.utils.arrayify(credentialHash));
    return signature;
  }

  private async verifyCredentialSignature(credential: VerifiableCredential): Promise<boolean> {
    try {
      // Recreate credential without proof for verification
      const credentialWithoutProof = { ...credential };
      delete credentialWithoutProof.proof;
      
      const credentialHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(JSON.stringify(credentialWithoutProof))
      );
      
      // Recover signer from signature
      const recoveredAddress = ethers.utils.verifyMessage(
        ethers.utils.arrayify(credentialHash),
        credential.proof.jws
      );
      
      // Verify against issuer's public key
      return this.verifyIssuerAddress(credential.issuer, recoveredAddress);
    } catch (error) {
      return false;
    }
  }

  private async verifyDIDExists(did: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('decentralized_identities')
      .select('did')
      .eq('did', did)
      .single();
    
    return !!data;
  }

  private async isCredentialRevoked(credentialId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('credential_revocations')
      .select('id')
      .eq('credential_id', credentialId)
      .single();
    
    return !!data;
  }

  private async addToRevocationRegistry(credentialId: string): Promise<void> {
    try {
      const signer = new ethers.Wallet(process.env.IDENTITY_PRIVATE_KEY!, this.provider);
      const contract = this.identityContract.connect(signer);
      
      const tx = await contract.revokeCredential(credentialId);
      await tx.wait();
    } catch (error) {
      console.error('Failed to add to revocation registry:', error);
    }
  }

  private async processVerification(verification: IdentityVerification): Promise<void> {
    switch (verification.verificationType) {
      case 'email':
        await this.processEmailVerification(verification);
        break;
      case 'phone':
        await this.processPhoneVerification(verification);
        break;
      case 'social':
        await this.processSocialVerification(verification);
        break;
      case 'government':
        await this.processGovernmentVerification(verification);
        break;
      case 'biometric':
        await this.processBiometricVerification(verification);
        break;
    }
  }

  private async processEmailVerification(verification: IdentityVerification): Promise<void> {
    // Send verification email
    console.log(`Sending email verification to ${verification.verificationData.email}`);
  }

  private async processPhoneVerification(verification: IdentityVerification): Promise<void> {
    // Send SMS verification
    console.log(`Sending SMS verification to ${verification.verificationData.phone}`);
  }

  private async processSocialVerification(verification: IdentityVerification): Promise<void> {
    // Verify social account ownership
    console.log(`Verifying ${verification.verificationData.platform} account`);
  }

  private async processGovernmentVerification(verification: IdentityVerification): Promise<void> {
    // Process government ID verification
    console.log('Processing government ID verification');
  }

  private async processBiometricVerification(verification: IdentityVerification): Promise<void> {
    // Process biometric verification
    console.log('Processing biometric verification');
  }

  private async verifyIssuerAddress(issuerDID: string, address: string): Promise<boolean> {
    // Verify that the address matches the issuer's DID
    const { data } = await this.supabase
      .from('decentralized_identities')
      .select('public_key')
      .eq('did', issuerDID)
      .single();
    
    if (!data) return false;
    
    const issuerAddress = ethers.utils.computeAddress(data.public_key);
    return issuerAddress.toLowerCase() === address.toLowerCase();
  }

  private getIdentityContractABI(): any[] {
    return [
      "function registerDID(string memory did, string memory publicKey) public",
      "function revokeCredential(string memory credentialId) public",
      "function isDIDRegistered(string memory did) public view returns (bool)",
      "function isCredentialRevoked(string memory credentialId) public view returns (bool)",
      "event DIDRegistered(string indexed did, address indexed owner)",
      "event CredentialRevoked(string indexed credentialId, address indexed issuer)"
    ];
  }
}

export const decentralizedIdentityService = new DecentralizedIdentityService();