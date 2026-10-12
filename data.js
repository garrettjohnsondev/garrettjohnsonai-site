export const tracks=[
  {
    "id": "foundations",
    "name": "AI foundations",
    "audience": "Start here",
    "access": "Free",
    "description": "Understand what AI can do, give it better context, and know how to check its work.",
    "minutes": 32,
    "lessons": [
      "evidence",
      "context",
      "control",
      "outcome"
    ],
    "outcome": "A practical way to work with AI, without needing a technical background.",
    "motif": "foundation"
  },
  {
    "id": "business",
    "name": "AI for your business",
    "audience": "Owners & operators",
    "access": "Member",
    "description": "Find a useful first workflow. Understand the cost. Keep your business in control.",
    "minutes": 26,
    "lessons": [
      "opportunity",
      "handoff",
      "exit"
    ],
    "outcome": "A realistic automation brief you can use to evaluate a tool for your business.",
    "motif": "business"
  },
  {
    "id": "product",
    "name": "Lead with AI",
    "audience": "PMs & team leads",
    "access": "Member",
    "description": "Ask sharper questions, diagnose failures, and make a better decision about what ships.",
    "minutes": 28,
    "lessons": [
      "retrieval",
      "release",
      "recovery"
    ],
    "outcome": "An evidence-based release decision, with clear tests and acceptance criteria.",
    "motif": "product"
  }
];
export const lessons={
  "evidence": {
    "title": "Check the source. Fix the answer.",
    "short": "Check the source. Fix the answer.",
    "track": "foundations",
    "duration": 7,
    "kind": "evidence",
    "intro": "Inspect source files, repair an AI reply, and make your own evidence field guide.",
    "idea": "Before you trust the answer, check what it was based on.",
    "body": [
      "A language model generates responses from the information available to it and patterns learned during training. A fluent explanation can still use an outdated source or make an unsupported claim.",
      "Start with three questions: Is the source relevant? Is it current? Does it actually support the answer? A citation helps you inspect the evidence, but its presence alone does not make the answer correct.",
      "In this exercise, the assistant has two versions of a returns policy. Your job is to decide whether its reply is ready to send."
    ],
    "takeaway": "Check the source, its date, and the claim. Confidence is not a fourth check.",
    "quiz": {
      "question": "The assistant gives exactly the same answer five times. What have you established?",
      "choices": [
        "The answer is factually correct.",
        "The answer repeated under those conditions.",
        "The answer uses the latest source."
      ],
      "correct": 1,
      "explanation": "Repeatability tells you about behavior. You still need evidence to establish whether the answer is correct."
    },
    "source": [
      "Causal language modeling",
      "https://huggingface.co/learn/llm-course/en/chapter7/6"
    ]
  },
  "context": {
    "title": "Give AI a better brief.",
    "short": "Give AI a better brief",
    "track": "foundations",
    "duration": 8,
    "kind": "context",
    "intro": "Assemble a project-update brief, test two situations, and keep a reusable template.",
    "idea": "Useful context is relevant context.",
    "body": [
      "A model cannot reliably follow a policy it has not been given. It may have broad background knowledge, but your latest policy, a customer’s situation, and the result you need belong in the task context.",
      "A useful brief states the task, supplies relevant source material, and describes a checkable output. Avoid adding old documents simply because there is room. More input can introduce conflicts instead of resolving them.",
      "Here, you are preparing an assistant to write a decision-ready project update. Build a brief with current facts and a rule for missing information. Test a routine case and one with an unassigned owner and a proposed date."
    ],
    "takeaway": "Name the task. Supply relevant evidence. Shape the output. Keep missing details visible.",
    "quiz": {
      "question": "A cancellation fee depends on an appointment time that is missing. Which brief would you use?",
      "choices": [
        "Assume the appointment is next week and confirm no fee.",
        "Use the current policy and ask for the appointment time before applying it.",
        "Include every old policy and ask for a confident answer."
      ],
      "correct": 1,
      "explanation": "The task, relevant evidence, output shape, and missing-detail rule keep the reply useful without inventing facts."
    },
    "source": [
      "Effective context engineering",
      "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents"
    ]
  },
  "control": {
    "title": "Keep the workflow in control.",
    "short": "Workflows and agents",
    "track": "foundations",
    "duration": 9,
    "kind": "control",
    "intro": "Build an approval workflow, test its boundaries, and keep your own control map.",
    "idea": "AI in a workflow does not automatically make it an autonomous agent.",
    "body": [
      "A workflow follows a sequence you define. It can include AI: read an inquiry, draft a reply, ask for approval, then send. The surrounding software still controls what happens next.",
      "An agent has more freedom to choose its next step from available tools based on what it observes. That can help with tasks whose route cannot be specified in advance, but it also creates more behavior to test.",
      "Choose the control structure around the job. A routine approval process often benefits from explicit steps. An investigation may need to search, compare, and adapt."
    ],
    "takeaway": "Give the system the freedom the task needs, then define where it must stop.",
    "quiz": {
      "question": "An investigation needs to choose its next search from what it finds. Which design fits?",
      "choices": [
        "Force every case through the same two searches.",
        "A bounded agent with read-only tools, a run limit, and human review.",
        "An agent with unrestricted permission to change customer records."
      ],
      "correct": 1,
      "explanation": "Let the search route adapt while keeping access, run limits, and review explicit."
    },
    "source": [
      "Building effective agents",
      "https://www.anthropic.com/engineering/building-effective-agents"
    ]
  },
  "outcome": {
    "title": "Verify the outcome.",
    "short": "Verify the outcome",
    "track": "foundations",
    "duration": 8,
    "kind": "outcome",
    "intro": "Inspect saved bookings, repair a mismatch, and keep a checklist for verifying results.",
    "idea": "“Done” is a claim you can verify.",
    "body": [
      "When an assistant acts on your behalf, its final message is only one part of the evidence. A booking needs to exist in the calendar. A record needs the right value. A message needs to reach the correct destination.",
      "Define success before running the task. Then inspect the system that owns the result. Check the details, not only whether something was created.",
      "In this exercise, an assistant says it moved an appointment. Compare that message with the booking record and decide what the team should do next."
    ],
    "takeaway": "Write a success condition that someone can check in the real system.",
    "quiz": {
      "question": "The assistant claims an email was delivered, but the tool only shows Queued. What can you report?",
      "choices": [
        "It was delivered because the assistant said so.",
        "It is queued; inspect the delivery result before claiming delivery.",
        "Send another copy immediately."
      ],
      "correct": 1,
      "explanation": "Report the state supported by the evidence. Queued does not establish delivery, and delivery does not establish that the recipient read it."
    },
    "source": [
      "Demystifying evals for AI agents",
      "https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents"
    ]
  },
  "opportunity": {
    "title": "Find a job worth automating.",
    "short": "Work out the real value",
    "track": "business",
    "duration": 8,
    "kind": "calculator",
    "intro": "Compare the time a workflow might save with the costs it introduces."
  },
  "handoff": {
    "title": "Teach the assistant when to hand off.",
    "short": "Keep an owner in control",
    "track": "business",
    "duration": 10,
    "kind": "rulebook",
    "intro": "Write after-hours rules for an AI receptionist, test them against a night of calls, and keep a rulebook for your own business."
  },
  "exit": {
    "title": "Choose a tool you can leave.",
    "short": "Plan the exit before buying",
    "track": "business",
    "duration": 8,
    "kind": "exit",
    "intro": "Inspect the practical cost of moving your workflow to another tool."
  },
  "retrieval": {
    "title": "Repair the confident, wrong answer.",
    "short": "Debug a retrieval failure",
    "track": "product",
    "duration": 10,
    "kind": "retrieval",
    "intro": "Separate finding the right evidence from generating a supported answer."
  },
  "release": {
    "title": "Decide what is ready to ship.",
    "short": "Set a release gate",
    "track": "product",
    "duration": 9,
    "kind": "release",
    "intro": "Weigh completion, unsupported answers, and human review in one release decision."
  },
  "recovery": {
    "title": "A timeout should not create two orders.",
    "short": "Design safer retries",
    "track": "product",
    "duration": 9,
    "kind": "recovery",
    "intro": "Handle an uncertain tool result without repeating an action blindly."
  }
};
export const briefs=[
  {
    "id": "release",
    "topic": "Model decisions",
    "title": "A new model is here. Does your team need it?",
    "description": "Practice the questions that turn a release announcement into a useful evaluation.",
    "label": "Decision lab",
    "minutes": 9
  },
  {
    "id": "opportunity",
    "topic": "Business value",
    "title": "The hidden line in your automation budget.",
    "description": "See how a few minutes of review can change the economics of a whole workflow.",
    "label": "Interactive calculator",
    "minutes": 8
  },
  {
    "id": "evidence",
    "topic": "AI essentials",
    "title": "The answer sounds right. Check one more thing.",
    "description": "A one-minute exercise in looking past confidence and checking the source.",
    "label": "Free practice",
    "minutes": 7
  }
];
export const trackFor=id=>tracks.find(t=>t.id===id);
export const lessonEntries=()=>Object.entries(lessons);
