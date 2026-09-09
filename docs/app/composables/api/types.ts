export interface TOCSection {
  id: string;
  label: string;
}

export interface ApiItem {
  id: string;
  name: string;
  type?: string;
  defaultValue?: string;
  returns?: string;
  signature?: string;
  desc: string;
  usage?: string;
  usageTitle?: string;
  usageLang?: string;
}
