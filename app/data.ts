export const data = {
  mode:"PHASE 1 • PREVIEW DATA",
  lastScan:"06:12 AM",
  metrics:[
    ["Signals analyzed","18,421","+12.6% vs yesterday"],
    ["Sources processed","1,247","8 source families"],
    ["Problem clusters","43","11 high momentum"],
    ["Opportunities","11","3 newly detected"],
    ["Major market shifts","3","2 need review"]
  ],
  brief:"The strongest pattern today is workflow compression: teams are actively looking for ways to remove repetitive coordination from revenue and reporting operations.",
  briefs:[
    ["WHAT CHANGED","AI-enabled workflow products are moving from assistants toward action-oriented operators.",18],
    ["PROBLEMS ACCELERATING","Manual reporting, fragmented lead handling and repetitive reconciliation remain recurring pain clusters.",27],
    ["WHERE DEMAND IS MOVING","SMB-focused automation is showing stronger signals where setup complexity is low and ROI is visible.",21],
    ["WHAT DESERVES ATTENTION","Look for products that replace a repeated workflow, not another dashboard layered on top of it.",14]
  ],
  changes:[
    ["AI SaaS pricing movement","Packaging, limits or positioning changed across multiple product pages.","HIGH"],
    ["Workflow automation demand","New problem signals around lead routing and follow-up.","HIGH"],
    ["Reporting friction persists","Repeated complaints across SMB operations and agency workflows.","MEDIUM"],
    ["Emerging compliance tooling","New product activity around monitoring and evidence collection.","MEDIUM"]
  ],  opportunities:[
    ["01","AI Follow-up Operator for SMBs","Coordinate lead intent, follow-up timing and next actions across fragmented inboxes.",91,90,87,84],
    ["02","Automated Weekly Reporting","Turn fragmented operational data into a verified management brief with evidence.",86,84,79,76],
    ["03","Invoice Reconciliation Copilot","Reduce repetitive matching and exception handling for small finance teams.",81,78,82,73]
  ],
  portfolio:[
    ["ORION","BUILDING",80,"MVP • 0 customers"],
    ["Lead Intelligence OS","VALIDATING",56,"Evidence review"],
    ["Revenue Workflow Agent","LIVE",100,"Tracked in portfolio"]
  ],  cost:{budget:10000,consumed:4821,reserved:812,available:4367,daily:411,forecast:8740},
  providers:[
    ["OpenAI","18.2M",1720,36],["Firecrawl","1,020 pg",1220,25],
    ["Tavily","1,244",910,19],["Exa","432",602,12],["Infrastructure","—",369,8]
  ],
  evidence:[
    ["Official product pages","Packaging and positioning changes were detected across multiple AI workflow products.","DIRECT",94],
    ["User problem signals","Repeated complaints point to manual follow-up, reporting and reconciliation work.","USER SIGNAL",87],
    ["Market activity","New product activity suggests continued demand for workflow automation.","MARKET",81],
    ["Competitor snapshots","Existing tools often optimize a feature rather than the complete workflow.","COMPETITOR",84]
  ]
} as const;