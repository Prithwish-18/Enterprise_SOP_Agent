# OpsMind AI - Enterprise SOP Knowledge Brain

A production-ready, context-aware corporate knowledge brain using **Retrieval-Augmented Generation (RAG)**. OpsMind AI transforms static standard operating procedures (SOPs) into an interactive, highly accurate AI assistant that strictly relies on approved documentation.

## Problem Statement

In enterprise environments, employees often struggle to find accurate and up-to-date information hidden within hundreds of pages of complex Standard Operating Procedures (SOPs) and company documents. Traditional keyword searches are ineffective for understanding context, and relying on general knowledge from Large Language Models (LLMs) poses a massive risk of **hallucinations** (where the AI confidently provides incorrect or non-compliant information). Enterprises need a solution that is conversational, contextually aware, and **strictly grounded** in verified corporate documents.

## Planning & Approach to Solve

To solve this, we implemented a sophisticated **RAG (Retrieval-Augmented Generation)** architecture specifically tailored for zero-hallucination tolerance:
1. **Document Ingestion**: Parse text from uploaded SOP PDFs and chunk them into semantically meaningful segments.
2. **Vector Embeddings**: Convert these text chunks into high-dimensional vectors using Google's generative AI embedding models.
3. **Vector Database**: Store and index these embeddings in MongoDB Atlas Vector Search for extremely fast semantic retrieval.
4. **Context-Aware Retrieval**: When a user asks a question, embed the query and retrieve the most mathematically similar text chunks from the vector database.
5. **Grounded Generation**: Feed the retrieved context into a Large Language Model (Gemini), heavily prompting it to **only** use the provided context to answer the question, and to explicitly state if the answer is not found in the documents.
6. **Source Attribution**: Return the answer along with exact citations (document name and metadata) so users can verify the source of truth.

## System Architecture

The project is divided into a decoupled Frontend and Backend, communicating via RESTful APIs and Server-Sent Events (SSE).

### Backend (Node.js / Express)
- **Framework**: Node.js with Express.js.
- **Database**: MongoDB Atlas for storing document metadata and chunks.
- **Vector Search**: MongoDB Atlas Vector Search for semantic similarity matching.
- **AI Models**: Google Gemini (`text-embedding-004` for vectors, `gemini-1.5-flash` for text generation).
- **Features**: PDF parsing (`pdf-parse`), chunking, embedding generation, RAG pipeline, and SSE streaming for real-time text delivery.

### Frontend (React / Vite)
- **Framework**: React built with Vite.
- **Styling**: Vanilla CSS for a custom, professional, and dynamic aesthetic.
- **State Management**: React Context API (`ChatContext`).
- **Features**: Live typing effects via Server-Sent Events (SSE), document upload panel, source viewer for citations, and an intuitive chat interface.

---

## Setup & Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB Atlas Account** (Free tier works)
- **Google Gemini API Key** (Get one from Google AI Studio)
- **Git**

### 1. MongoDB Atlas & Vector Search Setup
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under "Database Access", create a user with read/write privileges.
3. Under "Network Access", allow IP access (e.g., `0.0.0.0/0` for development).
4. Get your connection string (URI) starting with `mongodb+srv://...`.
5. Create a database named `opsmind` and a collection named `chunks`.
6. Go to the **Atlas Search** tab, click **Create Search Index**, choose **Atlas Vector Search** (JSON Editor), select the `opsmind.chunks` collection, and use the following configuration:
   ```json
   {
     "fields": [
       {
         "numDimensions": 768,
         "path": "embedding",
         "similarity": "cosine",
         "type": "vector"
       }
     ]
   }
   ```
   *Note: Name the index `vector_index`.*

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory with the following variables:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
   *The backend will run on `http://localhost:5000`.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. *(Optional)* If your backend is running on a different port, update the API URL in `frontend/src/services/api.js`. It defaults to `http://localhost:5000`.
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173`.*

---

## How to Run Locally

To run the full stack, you need both servers running simultaneously. 

1. **Terminal 1**: 
   ```bash
   cd backend
   npm run dev
   ```
2. **Terminal 2**: 
   ```bash
   cd frontend
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5173`.
4. **Usage Workflow**:
   - Go to the **Admin Portal** to upload your PDF SOPs.
   - Wait for the backend to parse, chunk, embed, and index the document.
   - Go to the **Chat** interface and ask questions about the uploaded document.

## Example Queries & Outputs

**Test Case 1 (Information exists in SOP):**
- *Query:* "What is the procedure for an emergency server shutdown?"
- *Output:* "To perform an emergency server shutdown, first isolate the network via the main switch, then hold the physical power button for 10 seconds. \n\n*Sources: Server_Maintenance_SOP.pdf*"

**Test Case 2 (Information does NOT exist in SOP):**
- *Query:* "What are the company's rules on remote work?"
- *Output:* "I cannot answer this question because the information is not present in the provided SOPs." *(Zero Hallucination Tolerance)*
