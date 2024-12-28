 import { ProofNameEnum } from "./ProofItem"


export enum JourneyStatusEnum{ 
  ANOUNCED = 'ANOUNCED',
  OPEN = 'OPEN',
  ONGOING = 'ONGOING',
  FINISHED = 'FINISHED',
  CANCELED = 'CANCELED'
}

export interface Journey { 
  id?: string
  title: string;
  location: string;
  description: string;
  guestCapacity: number;
  budget: number;
  status: JourneyStatusEnum;
  requiredProofs: ProofNameEnum[];
  customProofs?: ProofNameEnum[];
  startDate: Date | undefined;
  finishDate: Date | undefined;
  optionalQuestion?: string;
  photo?: string;
}

export interface JourneyFormData {
  title: string;
  location: string;
  description: string;
  guestCapacity: string;
  budget: string;
  startDate: Date | undefined;
  finishDate: Date | undefined;
  requiredProofs: ProofNameEnum[];
  status : JourneyStatusEnum;
  optionalQuestion: string;
  photo?: string;
}

export interface JourneyPreviewProps {
  title: string;
  location: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  budget: string;
  guestCapacity: string;
  requiredProofs: ProofNameEnum[];
  optionalQuestion: string;
  photo?: string;
  description: string;
  onEdit: () => void;
  onConfirm: () => void;
  socialMedia?: { platform: string;  username:string }
}

export const journeyFormToModel = (formData: JourneyFormData): Journey => ({
  title: formData.title,
  location: formData.location,
  description: formData.description,
  guestCapacity: parseInt(formData.guestCapacity),
  budget: parseFloat(formData.budget),
  status: formData.status,
  requiredProofs: formData.requiredProofs,
  startDate: formData.startDate,
  finishDate: formData.finishDate,
  optionalQuestion: formData.optionalQuestion,
  photo: formData.photo
});
