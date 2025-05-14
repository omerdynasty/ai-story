# AI Story and Language Agent

This is an Express.js application that integrates with Google's Gemini API for generating stories and providing language assistance. The API supports multiple API keys, retries on failure, and has two main functionalities: generating stories and assisting with language learning.

## Features

1. **Story Generation**: Generates stories based on a user's input sentence.
2. **AI Language Agent**: Assists users with language learning, offering translations, corrections, and simple English sentences.
3. **API Key Rotation**: Automatically rotates through multiple API keys in case of failure.
4. **CORS Enabled**: The app supports cross-origin requests to allow integration with front-end applications.
5. **Customizable Configuration**: You can adjust the model and generation configurations.

## Requirements

* **Node.js**: Ensure you have [Node.js](https://nodejs.org/) installed on your machine.
* **Environment Variables**: Set up the API keys in your `.env` file for the Gemini API integration.

## Installation

1. **Clone the Repository** or download the project files.

2. **Install Dependencies**:
   Run the following command to install the necessary dependencies:

   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the root of the project and add your Gemini API keys:

   ```env
   GEMINI_API_KEY=your_primary_api_key
   GEMINI_API_KEY_BACKUP1=your_backup_api_key_1
   GEMINI_API_KEY_BACKUP2=your_backup_api_key_2
   GEMINI_API_KEY_BACKUP3=your_backup_api_key_3
   GEMINI_API_KEY_BACKUP4=your_backup_api_key_4
   GEMINI_API_KEY_BACKUP5=your_backup_api_key_5
   ```

4. **Start the Server**:
   After setting up the environment variables, run the following command to start the Express server:

   ```bash
   npm start
   ```

   This will start the server on port `3000` (or a port specified by `PORT` in your `.env` file).

## Endpoints

### 1. `/generate-story` (POST)

**Description**: Generates a story based on a user's input sentence.

**Request Body**:

```json
{
  "sentence": "Once upon a time in a distant land..."
}
```

**Response**:

```json
{
  "story": "Once upon a time in a distant land, there was a kingdom ruled by a wise king..."
}
```

### 2. `/ai-agent` (POST)

**Description**: A language learning assistant that provides translation, corrections, and simple English sentences.

**Request Body**:

```json
{
  "messages": [
    {
      "role": "user",
      "parts": "Hello, can you help me learn English?"
    }
  ]
}
```

**Response**:

```json
{
  "response": "Sure! I can help you learn English. How would you like to start?"
}
```

### 3. `/generate-story` (HEAD)

**Description**: Checks the availability of the `/generate-story` endpoint.

### 4. `/ai-agent` (HEAD)

**Description**: Checks the availability of the `/ai-agent` endpoint.

## API Key Rotation

The app uses multiple API keys for the Gemini API to ensure availability. The keys are rotated automatically when one fails.

## Configuration

You can adjust the following parameters in the script:

* **Model Name**: The AI model used for generating content. The default model is `gemini-2.0-flash-lite`.

  ```js
  const modelConfig = {
      modelName: 'gemini-2.0-flash-lite',
  };
  ```

* **Generation Settings**: These settings affect the output of the AI, including temperature, max tokens, and top-k sampling.

  ```js
  const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
  };
  ```

## Error Handling

If all API keys fail or an error occurs, the app will throw an error:

```bash
Tüm API anahtarları başarısız oldu.
```

or

```bash
Yanıt oluşturulamadı.
```

## Contributing

Feel free to fork the repository, submit issues, and contribute improvements to the project.

## License

This project is open-source and available under the [GPL v3](LICENSE).
