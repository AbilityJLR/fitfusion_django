# Fitness Content RAG System with Pinecone and BGE-M3

This document explains how to set up and use the Retrieval Augmented Generation (RAG) system for fitness content in the FitFusion application.

## Overview

The FitFusion application now includes a RAG system that uses:
- **BGE-M3** embedding model from Hugging Face for generating embeddings
- **Pinecone** vector database for storing and retrieving embeddings
- **Django** backend with a SQLite3 database for storing fitness content
- **NextJS** frontend for interacting with the RAG system

## Setup Instructions

### 1. Pinecone Setup

1. Sign up for a Pinecone account at [https://www.pinecone.io/](https://www.pinecone.io/)
2. Create a new API key in your Pinecone dashboard
3. Create a `.env` file in the `server` directory with the following content:

```
# Django settings
SECRET_KEY=your-django-secret-key
DEBUG=True

# Pinecone settings
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=fitfusion-rag
```

4. Create the Pinecone index using the provided script:

```bash
cd server
python llm/create_pinecone_index.py
```

To reset an existing index (this will delete all embeddings!):

```bash
python llm/create_pinecone_index.py --force
```

### 2. Environment Setup

The required dependencies are already included in the `requirements.txt` file. Make sure your environment has these packages installed:

- sentence-transformers (for BGE-M3)
- pinecone-client
- python-dotenv

### 3. Database Setup

The FitnessContent model has been added to the database. To set it up:

1. Run migrations:
```
python manage.py migrate
```

## Using the RAG System

### Admin Interface

The admin interface allows you to manage fitness content:

1. Navigate to `/admin/fitness-content` in the frontend app
2. Add, edit, or delete fitness content entries
3. Each content entry includes:
   - Title
   - Description
   - Content type (exercise, workout, article, etc.)
   - URL (optional)
   - YouTube URL (optional)
   - Difficulty level
   - Equipment required
   - Duration (minutes)
   - Calories burned
   - Target muscles

When content is created or updated, it is automatically embedded using BGE-M3 and stored in Pinecone.

### Search Interface

Users can search for fitness content using the RAG system:

1. Navigate to `/rag-search` in the frontend app
2. Enter a search query
3. Optionally filter by content type or difficulty level
4. The system will use BGE-M3 embeddings to find semantically similar content

## API Endpoints

The following API endpoints are available:

1. `GET /api/fitness-content/search/` - Search for fitness content
   - Query parameters:
     - `query`: The search query (required)
     - `content_type`: Filter by content type (optional)
     - `difficulty_level`: Filter by difficulty level (optional)

2. `GET/POST/PUT/DELETE /api/fitness-content/` - Manage fitness content (admin only)

## Technical Implementation

### 1. Embedding Model

The system uses Hugging Face's BGE-M3 embedding model, which is a powerful multilingual model that generates 1024-dimensional embeddings.

### 2. Embedding Process

When fitness content is created or updated:
1. The relevant fields (title, description, etc.) are combined into a text
2. The text is embedded using BGE-M3
3. The embedding is stored in Pinecone along with metadata
4. The embedding ID is saved in the Django database for reference

### 3. Search Process

When a user searches for content:
1. The search query is embedded using BGE-M3
2. The embedding is used to search Pinecone for similar content
3. Pinecone returns the most semantically similar content based on cosine similarity
4. The results are returned to the user with metadata

## Troubleshooting

If you encounter issues with the RAG system:

1. Check that your Pinecone API key is correct in the `.env` file
2. Ensure the BGE-M3 model is properly downloaded
3. Check the logs for any error messages
4. Verify that fitness content has been added and properly embedded

If you have issues with Pinecone index creation, try the following:

1. Run the included utility script to manually create the index:
   ```
   python llm/create_pinecone_index.py
   ```
2. To reset the index (delete and recreate), use the force flag:
   ```
   python llm/create_pinecone_index.py --force
   ```
3. Verify the index was created successfully by checking the Pinecone console

## Extending the RAG System

The RAG system can be extended in several ways:

1. Add more content types to the FitnessContent model
2. Integrate with other fitness data sources
3. Implement more advanced filtering based on user profiles
4. Use the embeddings for recommendation systems 