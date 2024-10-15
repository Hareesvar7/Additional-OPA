const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();  // Load environment variables from .env

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Set up Multer for file uploads (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Handle policy evaluation
app.post("/evaluate", upload.fields([{ name: "regoFile" }, { name: "jsonFile" }]), (req, res) => {
    const regoFileContent = req.files.regoFile[0].buffer.toString(); // Rego file content
    const jsonFileContent = req.files.jsonFile[0].buffer.toString(); // JSON file content
    const policyInput = req.body.policyInput; // Policy input from user

    // Save Rego and JSON files temporarily to disk
    const regoFilePath = path.join(__dirname, "temp_policy.rego");
    const jsonFilePath = path.join(__dirname, "temp_plan.json");

    fs.writeFileSync(regoFilePath, regoFileContent);
    fs.writeFileSync(jsonFilePath, jsonFileContent);

    // OPA eval command based on user input
    const opaCommand = `opa eval -i ${jsonFilePath} -d ${regoFilePath} "${policyInput}"`;

    // Execute the OPA command
    const { exec } = require("child_process");
    exec(opaCommand, (error, stdout, stderr) => {
        // Clean up temporary files
        fs.unlinkSync(regoFilePath);
        fs.unlinkSync(jsonFilePath);

        if (error) {
            console.error(`Error: ${stderr}`);
            return res.status(500).json({ error: "Error evaluating the policy." });
        }

        // Send the result back to the frontend
        res.json({ output: stdout });
    });
});

// Handle AI Assist with GPT-4
app.post("/ai-assist", async (req, res) => {
    const { prompt } = req.body;

    // Check if prompt is provided
    if (!prompt) {
        return res.status(400).json({ error: "Missing required parameter: prompt" });
    }

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions", // Updated endpoint for chat models
            {
                model: "gpt-4",  // Specify GPT-4
                messages: [{ role: "user", content: prompt }], // Format the input as messages
                max_tokens: 150,  // Ensure this value is provided to control token length
                temperature: 0.7,  // Optional but recommended for creative outputs
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        res.json({ aiOutput: response.data.choices[0].message.content.trim() }); // Access the message content from the response
    } catch (error) {
        console.error("Error with AI Assist:", error.response ? error.response.data : error.message);
        
        // Return a detailed error message to the frontend
        res.status(error.response ? error.response.status : 500).json({
            error: error.response ? error.response.data.error.message : "Internal Server Error",
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
