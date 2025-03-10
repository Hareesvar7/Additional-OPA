const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
require("dotenv").config(); // Load environment variables from .env

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Set up Multer for file uploads (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Utility function to execute shell commands
const execCommand = (command, callback) => {
    exec(command, callback);
};

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
    execCommand(opaCommand, (error, stdout, stderr) => {
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
                model: "gpt-4", // Specify GPT-4
                messages: [{ role: "user", content: prompt }], // Format the input as messages
                max_tokens: 150, // Control token length
                temperature: 0.7, // Optional but recommended for creative outputs
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

// Handle conversion from main.tf to plan.json
app.post("/convert", upload.single("tfFile"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No TF file uploaded." });
    }

    const tfFileContent = req.file.buffer.toString(); // Main.tf file content
    const tfFilePath = path.join(__dirname, "temp_main.tf");
    
    // Save the TF file temporarily to disk
    fs.writeFileSync(tfFilePath, tfFileContent);

    // Command to convert the TF file to plan.json
    const convertCommand = `terraform plan -out=temp_plan.tfplan && terraform show -json temp_plan.tfplan > plan.json`;

    // Execute the Terraform command
    execCommand(convertCommand, (error, stdout, stderr) => {
        fs.unlinkSync(tfFilePath); // Clean up the TF file

        if (error) {
            console.error(`Error: ${stderr}`);
            return res.status(500).json({ error: "Error converting the TF file." });
        }

        // Send the plan.json back to the client for download
        res.download(path.join(__dirname, "plan.json"), "plan.json", (err) => {
            if (err) {
                console.error("Error sending file:", err);
            }
            // Clean up the generated plan.json file
            fs.unlinkSync(path.join(__dirname, "plan.json"));
        });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
