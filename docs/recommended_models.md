# Recommended Models & Providers

Prompt optimization is a translation and formatting task rather than a knowledge or deep logic task. The best models for this job are those that excel at strict instruction-following (IFEval benchmarks) and respond quickly.

## Recommended Tiers

### 1. Standard Tier (Best Value & Sweet Spot)
Standard models offer the best balance of instruction-following capability, speed, and cost. For 90% of tasks, these models will produce rewrites on par with premium offerings.
- **MiniMax-M3** (NVIDIA NIM or OpenRouter) - *Top overall instruction-following benchmark performer.*
- **Nemotron 3 Ultra** (NVIDIA NIM) - *Extremely fast and highly compliant.*
- **GPT-5.4 Mini** (OpenAI) - *The recommended choice if you bring an OpenAI API key.*

### 2. Premium Tier (Maximum Capability)
Premium models are suitable when your input prompt is extremely messy, vague, or complex, requiring strong reasoning to infer your original intent.
- **Qwen3.7 Max** (Alibaba direct or OpenRouter) - *Outstanding compliance and context understanding.*
- **Gemini 3.5 Flash (High)** (Google AI Studio) - *Very responsive with excellent structural formatting.*
- **GPT-5.5 Medium** (OpenAI) - *Strong performance; higher reasoning profiles are too slow for prompt editing.*

### 3. Cheap Tier (High Volume & Low Cost)
If you are optimizing thousands of prompts or on a tight budget:
- **DeepSeek V4 Flash** - *Near-premium formatting at a fraction of the cost.*
- **Gemini 3.1 Flash-Lite** - *Ultra-fast responses with clean sectioning.*
- **GPT-5.4 Nano** - *Efficient and lightweight OpenAI model.*

## API Providers Supported

- **OpenRouter:** A single hub providing access to Qwen, DeepSeek, Gemini, and Llama models. Supports a variety of free-tier models.
- **NVIDIA NIM:** Offers excellent speed and free-tier API endpoints for many open weights models like Nemotron and DeepSeek.
- **Google AI Studio:** Fast, smart, and often has generous free rate limits for Gemini 3.5/3.1 models.
- **OpenAI / Anthropic:** Directly configure your sk- keys for official GPT or Claude models.
