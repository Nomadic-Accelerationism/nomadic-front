export enum ProofNameEnum {
  APE_HOLDER = 'APE_HOLDER',
  BAYC_NFT = 'BAYC_NFT',
  ETHGLOBAL_HACKER = 'ETHGLOBAL_HACKER',
  ETHGLOBAL_VOLUNTEER = 'ETHGLOBAL_VOLUNTEER',
  PATRICIO_POAP = 'PATRICIO_POAP',
  NOUNS_NFT = 'NOUNS_NFT',
  TALENT_PROTOCOL_PASSPORT = 'TALENT_PROTOCOL_PASSPORT',
  WORLD_ID_POH = 'WORLD_ID_POH',
}
export interface ProofItem {
  proof: ProofNameEnum;
  name: string;
  title: string;
  description: string;
  icon: string;
  hasCount: boolean;
  count: number;
  isActive: boolean;
  status: boolean;
}

export const notMetMessages = {
  [ProofNameEnum.PATRICIO_POAP]: "It seems that you have not met Patricio",
  [ProofNameEnum.APE_HOLDER]: "It seems that you are not an Ape Holder",
  [ProofNameEnum.BAYC_NFT]: "It seems that you do not have a BAYC NFT",
  [ProofNameEnum.ETHGLOBAL_HACKER]: "It seems that you are not an ETHGlobal Hacker",
  [ProofNameEnum.ETHGLOBAL_VOLUNTEER]: "It seems that you are not an ETHGlobal Volunteer",
  [ProofNameEnum.NOUNS_NFT]: "It seems that you do not have a NOUNS NFT",
  [ProofNameEnum.TALENT_PROTOCOL_PASSPORT]: "It seems that you do not have a Talent Protocol Passport",
  [ProofNameEnum.WORLD_ID_POH]: "It seems that you do not have a World ID POH",
}

export const metMessages = {
  [ProofNameEnum.PATRICIO_POAP]: "You have met Patricio",
  [ProofNameEnum.APE_HOLDER]: "You are an Ape Holder",
  [ProofNameEnum.BAYC_NFT]: "You have a BAYC NFT",
  [ProofNameEnum.ETHGLOBAL_HACKER]: "You are an ETHGlobal Hacker",
  [ProofNameEnum.ETHGLOBAL_VOLUNTEER]: "You are an ETHGlobal Volunteer",
  [ProofNameEnum.NOUNS_NFT]: "You have a NOUNS NFT",
  [ProofNameEnum.TALENT_PROTOCOL_PASSPORT]: "You have a Talent Protocol Passport",
  [ProofNameEnum.WORLD_ID_POH]: "You have a World ID POH",
}

export function getNotMetMessage(proofName: string): string {
  try {
    const enumValue = ProofNameEnum[proofName as keyof typeof ProofNameEnum];
    return notMetMessages[enumValue] || '';
  } catch {
    return '';
  }
}

export function getMetMessage(proofName: string): string {
  try {
    const enumValue = ProofNameEnum[proofName as keyof typeof ProofNameEnum];
    return metMessages[enumValue] || '';
  } catch {
    return '';
  }
}

