===============================================
API Reference
===============================================

This document provides comprehensive documentation for all Cirkel.io APIs.

Base URL
========

All API requests should be made to:

.. code-block::

   https://api.cirkel.io/v1

Authentication
==============

Most endpoints require authentication using JWT tokens:

.. code-block:: http

   Authorization: Bearer <your-jwt-token>

Authentication Endpoints
------------------------

Login
~~~~~

.. code-block:: http

   POST /auth/login
   Content-Type: application/json

   {
     "email": "user@example.com",
     "password": "password123"
   }

Response:

.. code-block:: json

   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": "user_123",
       "email": "user@example.com",
       "username": "johndoe"
     }
   }

Register
~~~~~~~~

.. code-block:: http

   POST /auth/register
   Content-Type: application/json

   {
     "email": "user@example.com",
     "password": "password123",
     "username": "johndoe"
   }

Posts API
=========

Get Posts Feed
--------------

.. code-block:: http

   GET /posts?page=1&limit=20&sort=recent
   Authorization: Bearer <token>

Response:

.. code-block:: json

   {
     "posts": [
       {
         "id": "post_123",
         "content": "Hello world!",
         "author": {
           "id": "user_123",
           "username": "johndoe",
           "avatar": "https://..."
         },
         "createdAt": "2024-01-01T00:00:00Z",
         "likes": 42,
         "comments": 5,
         "shares": 2
       }
     ],
     "pagination": {
       "page": 1,
       "limit": 20,
       "total": 100,
       "hasNext": true
     }
   }

Create Post
-----------

.. code-block:: http

   POST /posts
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "content": "My new post content",
     "media": ["image_url_1", "image_url_2"],
     "hashtags": ["#technology", "#ai"],
     "mentions": ["@username"],
     "visibility": "public"
   }

Web3 API
========

NFT Endpoints
-------------

Get NFT Collection
~~~~~~~~~~~~~~~~~~

.. code-block:: http

   GET /web3/nfts?wallet=0x123...&blockchain=ethereum
   Authorization: Bearer <token>

Mint NFT
~~~~~~~~

.. code-block:: http

   POST /web3/nft/mint
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "name": "My NFT",
     "description": "A unique digital asset",
     "image": "https://...",
     "attributes": [
       {"trait_type": "Color", "value": "Blue"},
       {"trait_type": "Rarity", "value": "Rare"}
     ]
   }

Cryptocurrency Endpoints
------------------------

Get Wallet Balance
~~~~~~~~~~~~~~~~~~

.. code-block:: http

   GET /web3/wallet/balance?address=0x123...
   Authorization: Bearer <token>

Send Transaction
~~~~~~~~~~~~~~~~

.. code-block:: http

   POST /web3/transaction/send
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "to": "0x456...",
     "amount": "1.5",
     "currency": "ETH",
     "memo": "Payment for services"
   }

AI API
======

Translation
-----------

.. code-block:: http

   POST /ai/translate
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "text": "Hello, how are you?",
     "targetLanguage": "es",
     "context": "casual"
   }

Response:

.. code-block:: json

   {
     "translatedText": "Hola, ¿cómo estás?",
     "confidence": 0.95,
     "detectedLanguage": "en"
   }

Content Generation
------------------

.. code-block:: http

   POST /ai/generate
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "type": "caption",
     "prompt": "A beautiful sunset over the ocean",
     "tone": "inspirational",
     "length": "short"
   }

AR/VR API
=========

Spatial Audio Rooms
-------------------

Create Room
~~~~~~~~~~~

.. code-block:: http

   POST /ar/rooms
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "name": "My Spatial Room",
     "type": "conference",
     "capacity": 50,
     "environment": "office_space"
   }

Join Room
~~~~~~~~~

.. code-block:: http

   POST /ar/rooms/{roomId}/join
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "position": {"x": 0, "y": 0, "z": 0},
     "avatar": "avatar_id_123"
   }

Holographic Calls
-----------------

Start Call
~~~~~~~~~~

.. code-block:: http

   POST /ar/holographic/start
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "participants": ["user_123", "user_456"],
     "quality": "high",
     "recording": true
   }

Enterprise API
==============

CRM Integration
---------------

Setup Integration
~~~~~~~~~~~~~~~~~

.. code-block:: http

   POST /enterprise/crm/setup
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "platform": "salesforce",
     "apiKey": "your_api_key",
     "instanceUrl": "https://your-instance.salesforce.com"
   }

Sync Data
~~~~~~~~~

.. code-block:: http

   POST /enterprise/crm/{integrationId}/sync
   Authorization: Bearer <token>

Marketing Automation
--------------------

Create Campaign
~~~~~~~~~~~~~~~

.. code-block:: http

   POST /enterprise/marketing/campaigns
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "name": "Welcome Series",
     "type": "email",
     "trigger": "user_signup",
     "sequence": [
       {
         "delay": 0,
         "template": "welcome_email"
       },
       {
         "delay": 86400,
         "template": "onboarding_tips"
       }
     ]
   }

Analytics API
=============

Dashboard Data
--------------

.. code-block:: http

   GET /analytics/dashboard?period=30d&metrics=engagement,growth
   Authorization: Bearer <token>

Response:

.. code-block:: json

   {
     "period": "30d",
     "metrics": {
       "engagement": {
         "total": 15420,
         "change": 12.5,
         "trend": "up"
       },
       "growth": {
         "newUsers": 1250,
         "churnRate": 2.1,
         "retention": 85.3
       }
     },
     "charts": {
       "engagement": [
         {"date": "2024-01-01", "value": 450},
         {"date": "2024-01-02", "value": 520}
       ]
     }
   }

User Behavior
-------------

.. code-block:: http

   GET /analytics/behavior?userId=user_123&period=7d
   Authorization: Bearer <token>

Gaming API
==========

Games
-----

Get Available Games
~~~~~~~~~~~~~~~~~~~

.. code-block:: http

   GET /gaming/games?category=puzzle&difficulty=medium
   Authorization: Bearer <token>

Start Game Session
~~~~~~~~~~~~~~~~~~

.. code-block:: http

   POST /gaming/games/{gameId}/start
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "mode": "single_player",
     "difficulty": "medium"
   }

Achievements
------------

Get User Achievements
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: http

   GET /gaming/achievements?userId=user_123
   Authorization: Bearer <token>

Unlock Achievement
~~~~~~~~~~~~~~~~~~

.. code-block:: http

   POST /gaming/achievements/{achievementId}/unlock
   Authorization: Bearer <token>

Security API
============

Encryption
----------

Generate Key Pair
~~~~~~~~~~~~~~~~~~

.. code-block:: http

   POST /security/keys/generate
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "algorithm": "RSA",
     "keySize": 2048
   }

Encrypt Message
~~~~~~~~~~~~~~~

.. code-block:: http

   POST /security/encrypt
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "message": "Secret message",
     "recipientPublicKey": "-----BEGIN PUBLIC KEY-----..."
   }

Zero-Knowledge Proofs
---------------------

Create Proof
~~~~~~~~~~~~

.. code-block:: http

   POST /security/zk-proof
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "claim": "I am over 18 years old",
     "evidence": "encrypted_birth_date"
   }

Verify Proof
~~~~~~~~~~~~

.. code-block:: http

   POST /security/zk-proof/{proofId}/verify
   Authorization: Bearer <token>

WebSocket API
=============

Real-time Events
----------------

Connect to WebSocket:

.. code-block:: javascript

   const socket = io('wss://api.cirkel.io', {
     auth: {
       token: 'your-jwt-token'
     }
   });

   // Listen for events
   socket.on('new_message', (data) => {
     console.log('New message:', data);
   });

   socket.on('post_liked', (data) => {
     console.log('Post liked:', data);
   });

   // Send events
   socket.emit('join_room', { roomId: 'room_123' });

Error Handling
==============

All API endpoints return consistent error responses:

.. code-block:: json

   {
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Invalid input parameters",
       "details": {
         "field": "email",
         "reason": "Invalid email format"
       }
     }
   }

Common HTTP Status Codes:

- ``200`` - Success
- ``201`` - Created
- ``400`` - Bad Request
- ``401`` - Unauthorized
- ``403`` - Forbidden
- ``404`` - Not Found
- ``429`` - Rate Limited
- ``500`` - Internal Server Error

Rate Limiting
=============

API requests are rate limited:

- **Authenticated users**: 1000 requests per hour
- **Premium users**: 5000 requests per hour
- **Enterprise**: Custom limits

Rate limit headers:

.. code-block:: http

   X-RateLimit-Limit: 1000
   X-RateLimit-Remaining: 999
   X-RateLimit-Reset: 1640995200

SDKs and Libraries
==================

Official SDKs are available for:

- **JavaScript/TypeScript**: ``npm install @cirkel/sdk``
- **Python**: ``pip install cirkel-sdk``
- **Go**: ``go get github.com/cirkel-io/go-sdk``
- **Java**: Maven/Gradle packages available

Example usage:

.. code-block:: javascript

   import { CirkelSDK } from '@cirkel/sdk';

   const cirkel = new CirkelSDK({
     apiKey: 'your-api-key',
     baseUrl: 'https://api.cirkel.io/v1'
   });

   // Get user posts
   const posts = await cirkel.posts.getFeed({
     limit: 20,
     sort: 'recent'
   });

   // Create a post
   const newPost = await cirkel.posts.create({
     content: 'Hello from SDK!',
     hashtags: ['#sdk', '#api']
   });

Webhooks
========

Configure webhooks to receive real-time notifications:

.. code-block:: http

   POST /webhooks
   Authorization: Bearer <token>
   Content-Type: application/json

   {
     "url": "https://your-app.com/webhooks/cirkel",
     "events": ["post.created", "user.followed", "message.received"],
     "secret": "your-webhook-secret"
   }

Webhook payload example:

.. code-block:: json

   {
     "event": "post.created",
     "timestamp": "2024-01-01T00:00:00Z",
     "data": {
       "post": {
         "id": "post_123",
         "content": "New post content",
         "author": "user_123"
       }
     }
   }

GraphQL API
===========

GraphQL endpoint: ``https://api.cirkel.io/graphql``

Example query:

.. code-block:: graphql

   query GetUserPosts($userId: ID!, $limit: Int) {
     user(id: $userId) {
       id
       username
       posts(limit: $limit) {
         id
         content
         createdAt
         likes {
           count
         }
         comments {
           count
         }
       }
     }
   }

Example mutation:

.. code-block:: graphql

   mutation CreatePost($input: CreatePostInput!) {
     createPost(input: $input) {
       id
       content
       createdAt
       author {
         username
       }
     }
   }