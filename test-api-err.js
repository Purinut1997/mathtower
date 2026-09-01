import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = "AIzaSyAhvd55l4jCZhLM1cJjxlH3KawRYHi8lgI";

async function test() {
    const ai = new GoogleGenAI({
        apiKey: API_KEY || process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: "test",
        });
        console.log(response.text);
    } catch (e) {
        console.error(e);
    }
}
test();
