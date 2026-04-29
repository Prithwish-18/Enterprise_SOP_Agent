<div align="center">
  <h1>
  <img src="https://raw.githubusercontent.com/Prithwish-18/Enterprise_SOP_Agent/opsmind-ai/frontend/public/logo.png" width="30" />
    Opsmind Ai - Enterprise SOP Knowledge Brain
  <h1>
    <strong>A production-ready, context-aware corporate knowledge brain using Retrieval-Augmented Generation (RAG). OpsMind Ai transforms static standard operating procedures (SOPs) into an interactive, highly accurate AI assistant that strictly relies on approved documentation</strong>
  </p>
  <!-- <p>
    <a href="https://opsmind.ai.vercel.app">
      <img src="https://img.shields.io/badge/🚀 Live_Demo_vercel-View_Live-green?style=for-the-badge" />
    </a>
      <a href="https://opsmind.ai.netlify.app">
      <img src="https://img.shields.io/badge/🚀 Mirror_netlify-View_Live-green?style=for-the-badge" />
    </a>
  </p> -->
  <div>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Framer_Motion-000000?style=for-the-badge&logo=framer&logoColor=blue" alt="Framer Motion" />
   <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
   <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  </div>
</div>

## Problem Statement

In enterprise environments, employees often struggle to find accurate and up-to-date information hidden within hundreds of pages of complex Standard Operating Procedures (SOPs) and company documents. Traditional keyword searches are ineffective for understanding context and relying on general knowledge from Large Language Models (LLMs) poses a massive risk of **hallucinations** (where the AI confidently provides incorrect or non-compliant information). Enterprises need a solution that is conversational, contextually aware and **strictly grounded** in verified corporate documents.

## Planning & Approach to Solve

To solve this, we implemented a sophisticated **RAG (Retrieval-Augmented Generation)** architecture specifically tailored for zero-hallucination tolerance:
1. **Document Ingestion**: Parse text from uploaded SOP PDFs and chunk them into semantically meaningful segments.
2. **Vector Embeddings**: Convert these text chunks into high-dimensional vectors using Google's generative AI embedding models.
3. **Vector Database**: Store and index these embeddings in MongoDB Atlas Vector Search for extremely fast semantic retrieval.
4. **Context-Aware Retrieval**: When a user asks a question, embed the query and retrieve the most mathematically similar text chunks from the vector database.
5. **Grounded Generation**: Feed the retrieved context into a Large Language Model (Gemini), heavily prompting it to **only** use the provided context to answer the question and to explicitly state if the answer is not found in the documents.
6. **Source Attribution**: Return the answer along with exact citations (document name and metadata) so users can verify the source of truth.

## ⚙️ How It Works (Visual Walkthrough)

OpsMind Ai is designed to be as simple as uploading a file and sending a message.

### Step 1: Upload your enterprise documents
Head to the **Uploads** dashboard. Drag and drop your company's PDFs, Word docs or Text files. OpsMind automatically parses the text, breaks it into semantically meaningful chunks, creates secure high-dimensional vector embeddings and stores them in your private vault in MongoDB Atlas.

### Step 2: Ask questions in plain English
Switch to the **Chat** interface. Ask any question. The AI instantly scans your uploaded documents using Cosine Similarity vector search. It retrieves the exact context needed and generates a perfect answer—complete with **source citations** at the bottom of the message so you can verify the truth.

### Step 3: Pick up where you left off
Every question you ask is saved securely in your **Chat History**. You can easily access past conversations from any device, rename them or delete them when they are no longer needed. The platform remembers the context of your ongoing session.

### Step 4: Manage your security
Your **Profile** gives you total control. Change your password securely using an industry-standard reset flow. Most importantly, you can attach your own **Google Gemini API Key** to bypass shared server rate limits and guarantee lightning-fast, high-availability answers for your specific organization.

## 🚀 Market Value & Why Use OpsMind Ai?

In modern enterprise environments, employees waste countless hours digging through hundreds of pages of complex Standard Operating Procedures (SOPs), onboarding manuals and compliance protocols. Traditional keyword searches fail to understand intent and using public Large Language Models (LLMs) exposes the company to massive risks of **hallucinations** and **data leaks**.

**OpsMind Ai solves this.** 
It provides an isolated, multi-tenant RAG architecture that gives your team instant, conversational answers that are **strictly grounded** in your verified corporate documents. 
- **Zero Hallucination Tolerance:** If the answer isn't in your SOP, the AI will honestly state it doesn't know.
- **Enterprise Security:** User accounts are siloed. Data you upload is completely private to your account.
- **Cost Efficiency:** By allowing organizations to "Bring Your Own API Key", OpsMind scales linearly without bottlenecking server resources.

## 🏗️ System Architecture

The project is divided into a decoupled Frontend and Backend, communicating via RESTful APIs.

### Backend (Node.js / Express)
- **Framework**: Node.js with Express.js.
- **Database**: MongoDB Atlas (stores users, documents, chunks and chat history).
- **Vector Search**: MongoDB Atlas Vector Search for semantic similarity matching.
- **AI Models**: Google Gemini (`text-embedding-004` for vectors, `gemini-1.5-flash` for generation).
- **Security**: JWT Authentication, bcrypt password hashing and strict `email`-based scoping.
- **Features**: PDF parsing (`pdf-parse`), chunking, embedding generation, RAG pipeline and SSE streaming for real-time text delivery.

### Frontend (React / Vite)
- **Framework**: React built with Vite.
- **Styling**: Tailwind CSS & custom Glassmorphism CSS for a premium aesthetic.
- **State Management**: React Context API (`ChatContext`).
- **Features**: Real-time state synchronization, dynamic auth routing, and fully responsive mobile-first UI.

---

## 🛠️ Setup & Installation

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
   JWT_SECRET=your_super_secret_jwt_key
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

## 💻 How to Run Locally

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
   - Create an account on the **Sign Up** page.
   - Go to the **Chat** interface and click the **Upload (+)** button to ingest your PDF SOPs.
   - Wait for the document to finish processing.
   - Ask questions about the uploaded document!

---

## 📸 Screenshots & Visuals

<img width="1919" height="795" alt="Screenshot 2026-04-27 170825" src="https://github.com/user-attachments/assets/b148ada1-07c7-4787-a70a-a27eb595ed40" />

<img width="1919" height="775" alt="Screenshot 2026-04-27 170848" src="https://github.com/user-attachments/assets/cc9ad28c-48eb-4761-aaef-5805354d19de" />

<img width="1919" height="951" alt="Screenshot 2026-04-27 170928" src="https://github.com/user-attachments/assets/63a8f134-5b57-40fd-88dd-a5d2f7dca4df" />

<img width="1919" height="963" alt="Screenshot 2026-04-27 170941" src="https://github.com/user-attachments/assets/a85c79ff-8a8e-41d0-8eea-695cde8d775a" />

## 🔍 Example Queries & Outputs

**Test Case 1 (Information exists in SOP):**
- *Query:* "What is the procedure for an emergency server shutdown?"
- *Output:* "To perform an emergency server shutdown, first isolate the network via the main switch, then hold the physical power button for 10 seconds. \n\n*Sources: Server_Maintenance_SOP.pdf*"

**Test Case 2 (Information does NOT exist in SOP):**
- *Query:* "What are the company's rules on remote work?"
- *Output:* "I cannot answer this question because the information is not present in the provided SOPs." *(Zero Hallucination Tolerance)*

<img width="1837" height="875" alt="image" src="https://github.com/user-attachments/assets/5a78bf9b-be1d-4829-a693-cbb959763a68" />

