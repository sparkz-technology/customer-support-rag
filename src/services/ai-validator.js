/**
 * AI Response Validation Engine
 * Validates, sanitizes, and ensures quality of AI agent responses
 */

import { ChatGroq } from "@langchain/groq";
import { CONFIG } from "../config/index.js";

// Blocked patterns - things the AI should never say
const BLOCKED_PATTERNS = [
  // Internal system references
  /\b(internal\s+tool|database\s+query|api\s+call|backend|server\s+error)\b/i,
  /\b(mongodb|postgres|redis|pinecone)\b/i,
  /\b(api\s*key|secret\s*key|password|token)\b/i,
  
  // Harmful content
  /\b(kill|suicide|self[- ]?harm|violence)\b/i,
  /\b(hack|exploit|bypass\s+security|sql\s+injection)\b/i,
  
  // Inappropriate promises
  /\b(guarantee|100%|definitely\s+will|promise\s+to)\b/i,
  /\b(refund\s+immediately|instant\s+refund)\b/i,
  
  // Competitor mentions (customize as needed)
  /\b(competitor|other\s+company|switch\s+to)\b/i,
  
  // Personal data exposure patterns
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers
  /\b\d{16}\b/, // Credit card numbers
  /\b\d{3}[-]?\d{2}[-]?\d{4}\b/, // SSN pattern
];

// Required elements for good responses
const QUALITY_CHECKS = {
  minLength: 20,
  maxLength: 2000,
  minWords: 5,
  maxConsecutiveNewlines: 3,
};

// Sentiment indicators for escalation detection
const ESCALATION_INDICATORS = [
  /\b(angry|furious|frustrated|upset|disappointed)\b/i,
  /\b(unacceptable|terrible|worst|horrible|awful)\b/i,
  /\b(sue|lawyer|legal\s+action|report|complaint)\b/i,
  /\b(cancel|refund|money\s+back)\b/i,
  /\b(speak\s+to\s+manager|human\s+agent|real\s+person)\b/i,
];

// Confidence indicators in AI response
const LOW_CONFIDENCE_PATTERNS = [
  /\b(i'?m\s+not\s+sure|i\s+don'?t\s+know|uncertain|maybe|perhaps)\b/i,
  /\b(i\s+think|possibly|might\s+be|could\s+be)\b/i,
  /\b(i\s+cannot|unable\s+to|don'?t\s+have\s+access)\b/i,
];

/**
 * Validate AI response for blocked content
 */
export function validateContent(response) {
  const issues = [];
  
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(response)) {
      issues.push({
        type: 'blocked_content',
        pattern: pattern.toString(),
        severity: 'high',
      });
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Check response quality metrics
 */
export function checkQuality(response) {
  const issues = [];
  const trimmed = response.trim();
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  
  // Length checks
  if (trimmed.length < QUALITY_CHECKS.minLength) {
    issues.push({
      type: 'too_short',
      message: `Response too short (${trimmed.length} chars, min ${QUALITY_CHECKS.minLength})`,
      severity: 'medium',
    });
  }
  
  if (trimmed.length > QUALITY_CHECKS.maxLength) {
    issues.push({
      type: 'too_long',
      message: `Response too long (${trimmed.length} chars, max ${QUALITY_CHECKS.maxLength})`,
      severity: 'low',
    });
  }
  
  // Word count
  if (words.length < QUALITY_CHECKS.minWords) {
    issues.push({
      type: 'too_few_words',
      message: `Too few words (${words.length}, min ${QUALITY_CHECKS.minWords})`,
      severity: 'medium',
    });
  }
  
  // Excessive newlines
  const newlineMatches = trimmed.match(/\n{4,}/g);
  if (newlineMatches) {
    issues.push({
      type: 'excessive_newlines',
      message: 'Too many consecutive newlines',
      severity: 'low',
    });
  }
  
  // Check for empty or placeholder responses
  if (/^(ok|okay|sure|yes|no|hello|hi)\.?$/i.test(trimmed)) {
    issues.push({
      type: 'placeholder_response',
      message: 'Response appears to be a placeholder',
      severity: 'high',
    });
  }
  
  // Check for repetition
  const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
  if (sentences.length > 2 && uniqueSentences.size < sentences.length * 0.5) {
    issues.push({
      type: 'repetitive',
      message: 'Response contains repetitive content',
      severity: 'medium',
    });
  }
  
  return {
    valid: !issues.some(i => i.severity === 'high'),
    issues,
    metrics: {
      length: trimmed.length,
      words: words.length,
      sentences: sentences.length,
    },
  };
}

/**
 * Detect if customer message indicates need for escalation
 */
export function detectEscalation(customerMessage) {
  const indicators = [];
  
  for (const pattern of ESCALATION_INDICATORS) {
    if (pattern.test(customerMessage)) {
      indicators.push(pattern.toString());
    }
  }
  
  // Count exclamation marks and caps as frustration indicators
  const exclamations = (customerMessage.match(/!/g) || []).length;
  const capsRatio = (customerMessage.match(/[A-Z]/g) || []).length / customerMessage.length;
  
  const frustrationScore = indicators.length * 2 + exclamations + (capsRatio > 0.5 ? 3 : 0);
  
  return {
    shouldEscalate: frustrationScore >= 4,
    frustrationScore,
    indicators,
    recommendation: frustrationScore >= 4 
      ? 'Consider transferring to human agent' 
      : frustrationScore >= 2 
        ? 'Monitor closely for escalation'
        : 'Normal interaction',
  };
}

/**
 * Detect low confidence in AI response
 */
export function detectLowConfidence(response) {
  const indicators = [];
  
  for (const pattern of LOW_CONFIDENCE_PATTERNS) {
    const match = response.match(pattern);
    if (match) {
      indicators.push(match[0]);
    }
  }
  
  return {
    isLowConfidence: indicators.length >= 2,
    indicators,
    confidenceLevel: indicators.length === 0 ? 'high' : indicators.length === 1 ? 'medium' : 'low',
  };
}

/**
 * Sanitize AI response - remove/replace problematic content
 */
export function sanitizeResponse(response) {
  let sanitized = response;
  
  // Remove potential PII patterns
  sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
  sanitized = sanitized.replace(/\b\d{16}\b/g, '[CARD]');
  sanitized = sanitized.replace(/\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, '[ID]');
  
  // Remove internal references
  sanitized = sanitized.replace(/\b(database|api|backend|server)\s+(error|issue|problem)/gi, 'technical issue');
  sanitized = sanitized.replace(/\b(mongodb|postgres|redis|pinecone)\b/gi, 'our system');
  
  // Clean up excessive whitespace
  sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');
  sanitized = sanitized.replace(/[ \t]{3,}/g, '  ');
  
  // Trim
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Generate fallback response when AI fails validation
 */
export function getFallbackResponse(context = {}) {
  const fallbacks = {
    default: "I apologize, but I'm having trouble processing your request right now. Could you please rephrase your question, or would you like me to connect you with a support agent?",
    
    escalation: "I understand this is frustrating. Let me connect you with a support specialist who can better assist you with this issue.",
    
    lowConfidence: "I want to make sure I give you accurate information. Let me check with our support team and get back to you, or I can connect you with an agent right now.",
    
    blocked: "I apologize, but I'm not able to help with that particular request. Is there something else I can assist you with?",
    
    error: "I encountered an issue while processing your request. Please try again, or I can connect you with a support agent.",
  };
  
  return fallbacks[context.type] || fallbacks.default;
}

/**
 * Main validation function - validates and processes AI response
 */
export async function judgeResponseWithCritic({ response, customerMessage, ragContext }) {
  if (!CONFIG.GROQ_API_KEY || !ragContext) {
    return { grounded: true, issues: [], confidence: "low" };
  }

  const model = new ChatGroq({
    model: "llama-3.1-8b-instant",
    temperature: 0,
    apiKey: CONFIG.GROQ_API_KEY,
    maxTokens: 512,
  });

  const systemPrompt = "You are a strict groundedness judge. Check if the answer contains claims not supported by the provided context. Return strict JSON: {grounded:boolean, issues:[string], confidence:'low'|'medium'|'high'}.";
  const userPrompt = `Customer message: ${customerMessage || "(none)"}\n\nContext:\n${ragContext}\n\nAnswer:\n${response}`;

  try {
    const judge = await model.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const jsonStart = judge.content.indexOf("{");
    const jsonEnd = judge.content.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return { grounded: true, issues: [], confidence: "low" };
    }

    const parsed = JSON.parse(judge.content.slice(jsonStart, jsonEnd + 1));
    return {
      grounded: parsed.grounded !== false,
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      confidence: parsed.confidence || "low",
    };
  } catch (err) {
    console.warn("Critic validation failed:", err.message);
    return { grounded: true, issues: [], confidence: "low" };
  }
}

export async function validateAIResponse(response, customerMessage = '', options = {}) {
  const result = {
    isValid: true,
    originalResponse: response,
    processedResponse: response,
    issues: [],
    metadata: {},
  };
  
  // 1. Content validation
  const contentValidation = validateContent(response);
  if (!contentValidation.valid) {
    result.isValid = false;
    result.issues.push(...contentValidation.issues);
  }
  
  // 2. Quality checks
  const qualityCheck = checkQuality(response);
  result.metadata.quality = qualityCheck.metrics;
  if (!qualityCheck.valid) {
    result.isValid = false;
    result.issues.push(...qualityCheck.issues);
  }
  
  // 3. Confidence detection
  const confidence = detectLowConfidence(response);
  result.metadata.confidence = confidence;
  
  // 4. Escalation detection (from customer message)
  if (customerMessage) {
    const escalation = detectEscalation(customerMessage);
    result.metadata.escalation = escalation;
    
    if (escalation.shouldEscalate) {
      result.metadata.recommendedAction = 'escalate';
    }
  }
  
  // 5. Sanitize response
  result.processedResponse = sanitizeResponse(response);

  // 6. Critic groundedness check
  if (options.enableCritic) {
    const critic = await judgeResponseWithCritic({
      response: result.processedResponse,
      customerMessage,
      ragContext: options.ragContext || "",
    });

    result.metadata.critic = critic;
    if (!critic.grounded) {
      result.isValid = false;
      result.issues.push({
        type: "groundedness",
        message: critic.issues.join(" ") || "Answer contains unsupported claims",
        severity: "high",
      });
    }
  }
  
  // 7. If invalid, provide fallback
  if (!result.isValid) {
    const highSeverityIssues = result.issues.filter(i => i.severity === 'high');
    
    if (highSeverityIssues.some(i => i.type === 'blocked_content')) {
      result.processedResponse = getFallbackResponse({ type: 'blocked' });
    } else if (highSeverityIssues.some(i => i.type === 'placeholder_response')) {
      result.processedResponse = getFallbackResponse({ type: 'default' });
    }
  }
  
  // 8. Add low confidence fallback suggestion
  if (confidence.isLowConfidence && !result.metadata.recommendedAction) {
    result.metadata.recommendedAction = 'review';
    result.metadata.fallbackAvailable = getFallbackResponse({ type: 'lowConfidence' });
  }
  
  return result;
}

/**
 * Validate tool call arguments
 */
export function validateToolCall(toolName, args) {
  const validations = {
    get_customer_profile: {
      email: (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    },
    search_knowledge_base: {
      query: (v) => typeof v === 'string' && v.length >= 2 && v.length <= 500,
    },
    get_ticket_history: {
      email: (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    },
  };
  
  const toolValidation = validations[toolName];
  if (!toolValidation) {
    return { valid: true }; // Unknown tool, allow
  }
  
  const errors = [];
  for (const [field, validator] of Object.entries(toolValidation)) {
    if (!validator(args[field])) {
      errors.push(`Invalid ${field} for ${toolName}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  validateContent,
  checkQuality,
  detectEscalation,
  detectLowConfidence,
  sanitizeResponse,
  getFallbackResponse,
  validateAIResponse,
  judgeResponseWithCritic,
  validateToolCall,
};
