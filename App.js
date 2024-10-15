import React, { useState } from "react";

function App() {
    const [regoFile, setRegoFile] = useState(null);
    const [jsonFile, setJsonFile] = useState(null);
    const [tfFile, setTfFile] = useState(null); // State for main.tf file
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

    const handleTfFileChange = (event) => {
        setTfFile(event.target.files[0]); // Update state for main.tf file
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
            setOutput(data.output);
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

    // Function to handle conversion of main.tf to plan.json
    const handleConvert = async () => {
        const formData = new FormData();
        formData.append("tfFile", tfFile); // Append main.tf file to form data

        try {
            const response = await fetch("http://localhost:5000/convert", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to convert file");
            }

            // Trigger download of plan.json
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'plan.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error("Error during conversion:", error);
        }
    };

    return (
        <div style={styles.appContainer}>
            <h1 style={styles.heading}>Opa Policy Validator</h1>
            <div style={styles.inputContainer}>
                <div style={styles.fileInput}>
                    <label htmlFor="tfFile" style={styles.label}>Upload main.tf:</label>
                    <input type="file" id="tfFile" onChange={handleTfFileChange} style={styles.input} />
                    <button onClick={handleConvert} style={styles.button}>
                        Convert
                    </button>
                </div>
                <div style={styles.fileInput}>
                    <label htmlFor="regoFile" style={styles.label}>Upload Rego File:</label>
                    <input type="file" id="regoFile" onChange={handleRegoFileChange} style={styles.input} />
                </div>
                <div style={styles.fileInput}>
                    <label htmlFor="jsonFile" style={styles.label}>Upload JSON File:</label>
                    <input type="file" id="jsonFile" onChange={handleJsonFileChange} style={styles.input} />
                </div>
                <div style={styles.fileInput}>
                    <label htmlFor="policy" style={styles.label}>Policy Input:</label>
                    <input
                        type="text"
                        id="policy"
                        value={policy}
                        onChange={(e) => setPolicy(e.target.value)}
                        style={styles.input}
                    />
                    <button onClick={handleEvaluate} style={styles.button}>
                        Evaluate
                    </button>
                </div>
            </div>
            <div style={styles.outputContainer}>
                <label htmlFor="outputText" style={styles.labelCenter}>Output:</label>
                <textarea
                    id="outputText"
                    value={output}
                    onChange={(e) => setOutput(e.target.value)}
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
                        onChange={(e) => setAiOutput(e.target.value)}
                        rows="6"
                        style={styles.textArea}
                    />
                </div>
            </div>
        </div>
    );
}

// Styles...
const styles = {
    appContainer: {
        padding: "20px",
        fontFamily: "Arial, sans-serif",
    },
    heading: {
        textAlign: "center",
    },
    inputContainer: {
        marginBottom: "20px",
    },
    fileInput: {
        margin: "10px 0",
    },
    label: {
        display: "block",
        marginBottom: "5px",
    },
    input: {
        padding: "8px",
        width: "100%",
        maxWidth: "400px",
    },
    button: {
        padding: "10px 15px",
        marginTop: "10px",
        cursor: "pointer",
    },
    outputContainer: {
        marginTop: "20px",
    },
    textArea: {
        width: "100%",
        maxWidth: "400px",
        padding: "10px",
    },
    aiAssistContainer: {
        marginTop: "20px",
    },
    subHeading: {
        marginBottom: "10px",
    },
    smallTextArea: {
        width: "100%",
        maxWidth: "400px",
        padding: "10px",
    },
    aiOutputContainer: {
        marginTop: "10px",
    },
    labelCenter: {
        textAlign: "center",
        display: "block",
    },
};

export default App;
