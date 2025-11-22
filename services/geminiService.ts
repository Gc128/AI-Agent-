import { GoogleGenAI, Type, Schema, Content } from "@google/genai";
import { StudyPlan, DailyTask, JobPosting, Link, NewsItem } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing. Please set it in the environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "dummy_key" });

// --- 0. News Service ---
export const fetchIndustryNews = async (): Promise<NewsItem[]> => {
  try {
    const prompt = `
      请搜索关于 "AI Agent", "LLM Engineering", "Large Language Models" 的最新行业新闻（近 3 天）。
      请筛选出 5 条最有价值的新闻。
      
      请严格按照以下格式输出每个新闻的信息，不要包含任何其他开场白或结束语。
      使用 "---NEWS_START---" 作为每个新闻的开始分割线。

      格式要求：
      ---NEWS_START---
      TITLE: [新闻标题]
      SUMMARY: [简短摘要（中文，50字以内）]
      URL: [原文链接]
      SOURCE: [来源媒体]

      注意：确保信息真实来源于搜索结果。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const news: NewsItem[] = [];
    const rawBlocks = text.split("---NEWS_START---").filter(b => b.trim().length > 0);

    rawBlocks.forEach((block, index) => {
        const getValue = (key: string) => {
            const regex = new RegExp(`${key}:\\s*(.*)`);
            const match = block.match(regex);
            return match ? match[1].trim() : "";
        };

        const title = getValue("TITLE");
        let url = getValue("URL");
        let source = getValue("SOURCE");
        const summary = getValue("SUMMARY");

        // Fallback for URL using grounding chunks if necessary
        if ((!url || url === "undefined" || url === "null") && chunks.length > 0) {
             if (chunks[index] && chunks[index].web?.uri) {
                 url = chunks[index].web?.uri || "";
                 if (!source) source = chunks[index].web?.title || "";
             }
        }

        if (title) {
            news.push({
                title,
                summary,
                url,
                source
            });
        }
    });

    return news;

  } catch (error) {
    console.error("Error fetching news:", error);
    return [{
        title: "获取新闻失败",
        summary: "暂时无法获取最新行业新闻，请稍后再试。",
        url: "",
        source: "System"
    }];
  }
};

// --- 1. Job Market Service ---
export const fetchJobPostings = async (query: string = "AI Agent 开发工程师"): Promise<JobPosting[]> => {
  try {
    // We use a very strict prompt to force the model to format the Google Search results into our desired structure.
    const prompt = `
      请使用 Google Search 查找中国招聘网站上关于 "${query}" 的最新真实招聘信息（近一个月内）。
      查找至少 5 个不同的职位。
      
      请严格按照以下格式输出每个职位的信息，不要包含任何其他开场白或结束语。
      使用 "---JOB_START---" 作为每个职位的开始分割线。

      格式要求：
      ---JOB_START---
      TITLE: [职位名称]
      COMPANY: [公司名称]
      SALARY: [薪资范围，如 25k-40k 或 面议]
      LOCATION: [地点，如 北京·海淀]
      TAGS: [标签1, 标签2, 标签3] (用逗号分隔)
      RESPONSIBILITIES:
      - [职责1]
      - [职责2]
      REQUIREMENTS:
      - [要求1]
      - [要求2]
      BONUS:
      - [加分项1] (如果没有则留空)
      WELFARE:
      - [福利1] (如果没有则留空)
      DATE: [发布时间]
      URL: [招聘链接]
      SOURCE: [来源网站名称]

      注意：确保信息真实来源于搜索结果。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const jobs: JobPosting[] = [];
    const rawBlocks = text.split("---JOB_START---").filter(b => b.trim().length > 0);

    rawBlocks.forEach((block, index) => {
        const getValue = (key: string) => {
            const regex = new RegExp(`${key}:\\s*(.*)`);
            const match = block.match(regex);
            return match ? match[1].trim() : "";
        };

        const getList = (key: string) => {
            const regex = new RegExp(`${key}:\\s*([\\s\\S]*?)(?=(REQUIREMENTS:|BONUS:|WELFARE:|DATE:|URL:|SOURCE:|$))`);
            const match = block.match(regex);
            if (!match) return [];
            return match[1]
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.startsWith('-') || line.startsWith('•'))
                .map(line => line.substring(1).trim());
        };

        const title = getValue("TITLE");
        const company = getValue("COMPANY");
        
        // Attempt to extract URL from text or fallback to grounding chunks
        let url = getValue("URL");
        let source = getValue("SOURCE");

        if ((!url || url === "undefined") && chunks.length > index) {
             url = chunks[index].web?.uri || "";
             source = chunks[index].web?.title || "Web";
        }

        if (title && company) {
            jobs.push({
                id: Date.now().toString() + index,
                title,
                company,
                salary: getValue("SALARY") || "薪资面议",
                location: getValue("LOCATION") || "中国",
                tags: getValue("TAGS").split(/,|，/).map(t => t.trim()).filter(t => t),
                description: {
                    responsibilities: getList("RESPONSIBILITIES"),
                    requirements: getList("REQUIREMENTS"),
                    bonus: getList("BONUS"),
                    welfare: getList("WELFARE")
                },
                url,
                source: source || "Network",
                publishDate: getValue("DATE") || "近日"
            });
        }
    });

    return jobs;

  } catch (error) {
    console.error("Error fetching jobs:", error);
    return [{
        id: "error",
        title: "获取招聘信息失败",
        company: "系统提示",
        salary: "",
        location: "",
        tags: [],
        description: {
            responsibilities: ["请检查网络连接", "请确认 API Key 是否有效"],
            requirements: [],
        },
        url: "",
        source: "System",
        publishDate: new Date().toLocaleDateString()
    }];
  }
};

// --- 2. Study Plan Generation Service ---

const planSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy title for the study plan" },
    targetRole: { type: Type.STRING },
    totalDays: { type: Type.INTEGER },
    overview: { type: Type.STRING },
    schedule: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER },
          topic: { type: Type.STRING },
          description: { type: Type.STRING },
          tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
        }
      }
    }
  }
};

export const generateStudyPlan = async (
  roleDescription: string,
  days: number,
  imageBase64?: string
): Promise<StudyPlan> => {
  
  const promptText = `
    你是一名技术职业规划专家。请为一位想成为：“${roleDescription}” 的人制定一份 **大纲级别** 的 ${days} 天学习计划。

    **重要要求：**
    1. **循序渐进**：Day 1 从基础开始，逐渐过渡到进阶，最后是实战。
    2. **内容不重复**：每一天的主题必须不同（例如：Day1 变量, Day2 函数, Day3 面向对象）。
    3. **实战导向**：后期必须包含“项目开发”日。
    4. **任务具体**：Checklist 必须包含具体动作（如“编写 Hello World”，“阅读 React 官方文档”）。
    
    请全部使用中文回答。返回 JSON。
  `;

  const parts: any[] = [{ text: promptText }];
  
  if (imageBase64) {
    parts.unshift({
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg" 
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: planSchema,
    },
  });

  if (response.text) {
    const partialPlan = JSON.parse(response.text);
    
    // Ensure schedule is an array before mapping to avoid crash
    const schedule = Array.isArray(partialPlan.schedule) ? partialPlan.schedule : [];

    return {
        ...partialPlan,
        id: Date.now().toString(),
        createdAt: Date.now(),
        schedule: schedule.map((s: any) => ({
            ...s,
            tasks: Array.isArray(s.tasks) ? s.tasks : [], // Ensure tasks is array
            completed: false,
            resources: [],
            generatedLinks: [],
        }))
    } as StudyPlan;
  }
  throw new Error("Failed to generate plan");
};

// --- 3. Dynamic Daily Content Generation ---

export const generateDailyLearningMaterial = async (
  topic: string,
  role: string,
  customRequirements?: string
): Promise<{ content: string; links: Link[] }> => {
    try {
        let prompt = `
            我是正在以 "${role}" 为目标学习的学生。
            今天的学习主题是: "${topic}"。
            请为我生成一份详细的学习资料。
            
            通用要求：
            1. 包含核心概念讲解，层级清晰。
            2. **必须包含代码示例** (Python/JS/Java)，并使用 Markdown 代码块包裹。
            3. 解释通俗易懂。
            4. 包含 3 道面试题。
        `;
        
        if (customRequirements && customRequirements.trim()) {
            prompt += `\n\n用户特别要求：${customRequirements}\n请务必满足用户的特别要求。`;
        }

        prompt += `\n请使用 Google Search 查找最新的教程文档引用。\n请用 Markdown 格式返回。`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        const content = response.text || "生成内容为空";
        const links: Link[] = [];
        
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        chunks.forEach(chunk => {
            if (chunk.web) {
                links.push({
                    title: chunk.web.title || "相关资源",
                    url: chunk.web.uri || "#"
                });
            }
        });

        return { content, links };

    } catch (error) {
        console.error("Error generating daily content:", error);
        return { 
            content: "### 生成失败\n请检查网络连接或 API 配额后重试。", 
            links: [] 
        };
    }
}

// --- 4. Progress Review Service ---

export const reviewDailyProgress = async (task: DailyTask, userNotes: string): Promise<{ score: number; feedback: string }> => {
  const prompt = `
    任务: "${task.topic}".
    提交内容: "${userNotes}".
    请打分（0-100）并提供简短鼓励性反馈。
    返回 JSON: { "score": number, "feedback": "string" }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.INTEGER },
            feedback: { type: Type.STRING }
        }
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text);
  }
  return { score: 0, feedback: "生成反馈时出错。" };
};

// --- 5. Chat / Tutor Service ---

export const createChatSession = (history: Content[] = []) => {
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: "你是一名资深 AI 工程师和导师。请用中文帮助用户 debug 代码，理解复杂概念。回答要简洁透彻。必须使用 markdown 代码块。",
    },
    history: history
  });
};

// --- 6. Mock Interview Service ---

export const createInterviewSession = (
  role: string, 
  resumeText?: string, 
  resumeImageBase64?: string,
  existingHistory?: Content[]
) => {
  
  const systemInstruction = `
    你是一名严格但专业的 ${role} 岗位面试官。
    
    你的任务是：
    1. 基于用户的简历（如果提供）和目标岗位，进行模拟面试。
    2. **交互式提问**：不要一次性问所有问题。每次只问 1 个问题，等待用户回答。
    3. **问题类型**：
       - 必须包含手撕代码题（算法或场景题）。
       - 必须包含“八股文”（基础理论）。
       - 必须包含项目深挖（基于简历中的项目经验）。
    4. **追问**：如果用户回答太简单，请进行深挖和追问。
    5. **反馈阶段**：**非常重要**。
       - 当用户输入“面试结束”或“停止面试”，或者你认为面试已经完整时，**必须立即停止提问**。
       - 紧接着，**必须**生成一份详细的“# 面试评估报告”。
       - 报告**必须**使用 Markdown 格式，包含以下部分：
         - **优势分析**
         - **劣势与不足**
         - **代码/回答优化建议**
         - **最终录用建议（Pass/No Hire）**

    请用中文与候选人交流。保持专业、冷静的语气。
  `;

  let history = existingHistory || [];

  if (!existingHistory || existingHistory.length === 0) {
      let initialPrompt = "请开始面试。";
      if (resumeText) {
        initialPrompt += `\n\n这是我的简历内容:\n${resumeText}`;
      }

      const parts: any[] = [{ text: initialPrompt }];
      
      if (resumeImageBase64) {
          parts.push({ inlineData: { mimeType: 'image/jpeg', data: resumeImageBase64 } });
      }

      history = [
          {
              role: 'user',
              parts: parts
          },
          {
              role: 'model',
              parts: [{ text: `你好。我是这次 ${role} 岗位的面试官。我已经看过了你的简历（或了解了你的意向）。\n\n让我们开始吧。首先，请做一个简单的自我介绍，并重点讲讲你觉得最有挑战性的一个项目。` }]
          }
      ];
  }

  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7, 
    },
    history: history
  });
};