// pages/api/summarize.js

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();

    const { emailText } = req.body;

    const prompt = `
    You are an AI productivity assistant. Analyze the following email and return: 
    1. A 1-2 sentence summary
    2. Priority level (High, Medium, Low)
    3. Recommended action
    
    Email:
    """${emailText}"""
    `;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
            }),
        });

        const data = await response.json();

        //console.log("OpenAI Raw Response:", data);

        if (!data.choices || !data.choices[0]) {
            return res.status(500).json({
                error: "Invalid response from OpenAI",
                openaiResponse: data,
            });
        }

        const result = data.choices[0].message.content;
        res.status(200).json({ result });
    } catch (error) {
        console.error("Error calling OpenAI:", error);
        res.status(500).json({ error: "Something went wrong", details: error.message });
    }
}