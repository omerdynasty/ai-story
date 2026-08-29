# AI Story and Language Agent

An Express.js backend integrating Google's Gemini API for school-friendly story generation and conversational language tutoring. The service includes automatic API key failover rotation, strict origin/CORS validation, rate limiting, and request payload safeguards.

## Features

* **Story Generation**: Generates positive, school-appropriate stories (200–400 words) using system-level instruction constraints.
* **AI Language Agent**: A2-level conversational English tutor offering corrections and multilingual translation support without conversation history duplication.
* **Smart API Key Rotation (Failover)**: Rotates across multiple backup Gemini API keys on failures/rate limits and persists the active key index across requests.
* **Rate Limiting & DoS Protection**: Enforces an IP-based window rate limit (10 requests / 10 minutes) and restricts JSON payload size to 50 KB.
* **Origin-Controlled CORS**: Dynamic validation against a single authorized domain defined via environment variables.
* **Execution Telemetry**: Logs per-request duration (ms), active API key index, and model token usage metadata.

## Requirements

* **Node.js**: v18.0.0 or higher
* **Google Gemini API Key(s)**

## Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd <project-folder>

```


2. **Install dependencies**:
```bash
npm install

```


3. **Set up environment variables**:
Create a `.env` file in the root directory:
```env
PORT=3000
origin=http://localhost:5173

GEMINI_API_KEY=your_primary_api_key
GEMINI_API_KEY_BACKUP1=your_backup_api_key_1
GEMINI_API_KEY_BACKUP2=your_backup_api_key_2
GEMINI_API_KEY_BACKUP3=your_backup_api_key_3
GEMINI_API_KEY_BACKUP4=your_backup_api_key_4
GEMINI_API_KEY_BACKUP5=your_backup_api_key_5

```


4. **Start the server**:
```bash
npm start

```



## API Endpoints

### 1. Story Generation

* **Route**: `POST /generate-story`
* **Headers**: `Content-Type: application/json`
* **Body Rules**: `sentence` must be a non-empty string under 1,000 characters.

**Request Body:**

```json
{
  "sentence": "A curious cat discovers an old library in the forest."
}

```

**Success Response (200 OK):**

```json
{
  "story": "Once upon a time in a quiet green forest, a little cat named Oliver found an old wooden door..."
}

```

---

### 2. AI Language Agent

* **Route**: `POST /ai-agent`
* **Headers**: `Content-Type: application/json`
* **Body Rules**: `messages` must be a non-empty array of turn objects.

**Request Body:**

```json
{
  "messages": [
    {
      "role": "user",
      "parts": "Hello! Can you help me practice my English?"
    },
    {
      "role": "assistant",
      "parts": "Hello! Yes, I can help you. What did you do today?"
    },
    {
      "role": "user",
      "parts": "I go to library and readed a book."
    }
  ]
}

```

**Success Response (200 OK):**

```json
{
  "response": "Good job! Just a small correction: say \"I went to the library and read a book.\" What kind of book was it?"
}

```

---

### 3. Health & Availability Checks

* `HEAD /generate-story` -> Returns `200 OK`
* `HEAD /ai-agent` -> Returns `200 OK`

---

### Error Responses

| Status Code | Reason | Example Response |
| --- | --- | --- |
| `400 Bad Request` | Missing/invalid body fields | `{"error": "Geçersiz istek: \"sentence\" alanı dolu bir metin olmalıdır."}` |
| `403 Forbidden` | Origin does not match `.env` | `{"error": "Erişim engellendi: Geçersiz Origin"}` |
| `429 Too Many Requests` | Exceeded rate limit (>10 req / 10 min) | `{"error": "Çok fazla istek gönderildi. Lütfen 10 dakika sonra tekrar deneyin."}` |
| `500 Internal Server Error` | All API keys failed or execution error | `{"error": "Hikaye oluşturulamadı."}` |

## Configuration

* **Model**: Defaults to `gemini-flash-lite-latest`.
* **Generation Parameters**:
```js
const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
};

```



## License

This project is licensed under the [GPL v3](LICENSE).
