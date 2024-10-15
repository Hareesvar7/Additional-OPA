import React, { useState } from "react";

function App() {
    const [regoFile, setRegoFile] = useState(null);
    const [jsonFile, setJsonFile] = useState(null);
    const [policy, setPolicy] = useState("");
    const [output, setOutput] = useState("");
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiOutput, setAiOutput] = useState("");

    const handleRegoFileChange = (event) => {
        setRegoFile(event.target.files[0]);
    };

    const handleJsonFileChange = (event) => {
        setJsonFile(event.target.files[0]);
    };

    const handleEvaluate = async () => {
        const formData = new FormData();
        formData.append("regoFile", regoFile);
        formData.append("jsonFile", jsonFile);
        formData.append("policyInput", policy);

        try {
            const response = await fetch("http://localhost:5000/evaluate", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                setOutput(data.output);
            } else {
                setOutput("Error during evaluation: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error during evaluation:", error);
            setOutput("An error occurred during evaluation.");
        }
    };

    const handleAiAssist = async () => {
        try {
            const response = await fetch("http://localhost:5000/ai-assist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: aiPrompt,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Unknown error occurred");
            }

            const data = await response.json();

            if (data.aiOutput) {
                setAiOutput(data.aiOutput);
            } else {
                console.error("Error from backend:", data.error);
                setAiOutput(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error("Error during AI Assist:", error);
            setAiOutput("An error occurred during AI Assist.");
        }
    };

    return (
        <div style={styles.appContainer}>
            <h1 style={styles.heading}>Opa Policy Validator</h1>
            <div style={styles.inputContainer}>
                <input
                    type="file"
                    accept=".rego"
                    onChange={handleRegoFileChange}
                    style={styles.fileInput}
                />
                <input
                    type="file"
                    accept=".json"
                    onChange={handleJsonFileChange}
                    style={styles.fileInput}
                />
                <input
                    type="text"
                    value={policy}
                    onChange={(e) => setPolicy(e.target.value)}
                    placeholder="Enter policy input"
                    style={styles.policyInput}
                />
                <button onClick={handleEvaluate} style={styles.button}>
                    Evaluate Policy
                </button>
            </div>
            <div style={styles.outputContainer}>
                <label htmlFor="outputText" style={styles.labelCenter}>Output:</label>
                <textarea
                    id="outputText"
                    value={output}
                    readOnly
                    rows="10"
                    style={styles.textArea}
                />
            </div>
            <div style={styles.aiAssistContainer}>
                <h2 style={styles.subHeading}>AI Assist</h2>
                <label htmlFor="aiPrompt" style={styles.label}>Enter your prompt:</label>
                <textarea
                    id="aiPrompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows="2"
                    style={styles.smallTextArea}
                />
                <button onClick={handleAiAssist} style={styles.button}>
                    Generate AI Output
                </button>
                <div style={styles.aiOutputContainer}>
                    <label htmlFor="aiOutputText" style={styles.labelCenter}>AI Output:</label>
                    <textarea
                        id="aiOutputText"
                        value={aiOutput}
                        readOnly
                        rows="6"
                        style={styles.textArea}
                    />
                </div>
            </div>
        </div>
    );
}

// Styles
const styles = {
    appContainer: {
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
        border: "1px solid #ccc",
        borderRadius: "5px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    },
    heading: {
        textAlign: "center",
        marginBottom: "20px",
    },
    inputContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    fileInput: {
        padding: "10px",
    },
    policyInput: {
        padding: "10px",
    },
    button: {
        padding: "10px",
        backgroundColor: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
    },
    outputContainer: {
        marginTop: "20px",
    },
    labelCenter: {
        textAlign: "center",
        display: "block",
    },
    textArea: {
        width: "100%",
        padding: "10px",
        resize: "none",
    },
    smallTextArea: {
        width: "100%",
        padding: "10px",
        resize: "none",
    },
    aiAssistContainer: {
        marginTop: "20px",
    },
    subHeading: {
        marginBottom: "10px",
    },
    aiOutputContainer: {
        marginTop: "10px",
    },
};

export default App;
