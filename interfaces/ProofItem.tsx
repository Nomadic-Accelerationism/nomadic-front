enum ProofNameEnum {
  APE_HOLDER,
  BAYC_NFT,
  ETHGLOBAL_HACKER,
  ETHGLOBAL_VOLUNTEER,
  PATRICIO_POAP,
  NOUNS_NFT,
  TALENT_PROTOCOL_PASSPORT,
  WORLD_ID_POH,
}
export interface ProofItem {
  proof: ProofNameEnum;
    name: string;
    icon: string;
    isActive: boolean;
}