import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("GEMINI_API_KEY is not defined in environment variables");
        }
        genAI = new GoogleGenerativeAI(apiKey || "");
    }
    return genAI;
}

export interface OcrExtractionResult {
    order_details: {
        awb_number: string;
        buyer_name: string;
        courier_name: string;
        product_name: string;
    };
    metadata: {
        is_handwritten: boolean;
        confidence_score: number;
        extraction_status: "SUCCESS" | "FAILED_UNREADABLE";
    };
}

const SYSTEM_PROMPT = `
You are the "Zavvy OCR Engine," a specialized vision model designed for Indian e-commerce sellers. Your job is to analyze photos of physical courier receipts, invoices, or hand-written shipping notes and extract 100% accurate fulfillment data.

Extraction Rules:
1. AWB/Tracking Number: Look for labels like "Consignment No," "Tracking ID," "Waybill," or "AWB." Strip all spaces and special characters.
2. Buyer Details: Identify the "Consignee" or "To" section. Extract the full name.
3. Product/Item Name: Look for "Description," "Item," "Product," or "Contents" fields. Extract the product name or item description.
4. Courier Partner: Identify the company name from the logo or header (e.g., "India Post," "DTDC", "Delhivery", "BlueDart", "Ekart").
5. Handwriting Check: If the AWB or Name is clearly hand-written vs printed, set is_handwritten to true.
6. Confidence Score: Provide a score from 0.0 to 1.0 based on how clear the image is.

Safety Protocol: If the image is completely unreadable or not a receipt, return extraction_status: "FAILED_UNREADABLE" and leave order_details blank or empty strings.

Output: A single, valid JSON object following this exact schema. Do not include any conversational text, markdown formatting (like \`\`\`json), or explanations. Just the raw JSON string.
{
  "order_details": {
    "awb_number": "string",
    "buyer_name": "string",
    "courier_name": "string",
    "product_name": "string"
  },
  "metadata": {
    "is_handwritten": boolean,
    "confidence_score": number,
    "extraction_status": "SUCCESS" | "FAILED_UNREADABLE"
  }
}
`;

/**
 * Extracts shipping details from an image buffer using Gemini Vision.
 * @param imageBuffer The raw image buffer (e.g., from Telegram or Web Upload)
 * @param mimeType The mime type of the image (e.g., image/jpeg)
 * @returns Parsed JSON matching OcrExtractionResult
 */
export async function extractReceiptData(
    imageBuffer: Buffer,
    mimeType: string
): Promise<OcrExtractionResult> {
    try {
        const model = getGenAI().getGenerativeModel({ model: "gemini-1.5-flash" });

        const imagePart = {
            inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType,
            },
        };

        const result = await model.generateContent([SYSTEM_PROMPT, imagePart]);
        const response = await result.response;
        let text = response.text();

        // Clean markdown if the model hallucinates it despite instructions
        text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

        const parsedData = JSON.parse(text) as OcrExtractionResult;
        return parsedData;

    } catch (error) {
        console.error("Gemini OCR Error:", error);
        return {
            order_details: {
                awb_number: "",
                buyer_name: "",
                courier_name: "",
                product_name: "",
            },
            metadata: {
                is_handwritten: false,
                confidence_score: 0.0,
                extraction_status: "FAILED_UNREADABLE",
            },
        };
    }
}
