import { ProofNameEnum } from "./ProofItem";

export enum JourneyStatusEnum {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED",
}

export interface Journey {
  id?: string;
  title: string;
  location: string;
  description: string;
  guestCapacity: number;
  budget: number;
  status: JourneyStatusEnum;
  requiredProofs: ProofNameEnum[];
  customProofs?: ProofNameEnum[];
  startDate: Date | undefined;
  endDate: Date | undefined;
  optionalQuestion?: string;
  photo?: string;
  creatorAddress: string;
}

export interface JourneyFormData {
  id?: string;
  title: string;
  location: string;
  description: string;
  guestCapacity: string;
  budget: string;
  startDate: Date | undefined;
  finishDate: Date | undefined;
  requiredProofs: ProofNameEnum[];
  status: JourneyStatusEnum;
  optionalQuestion: string;
  photo?: string;
  creatorAddress: string;
}

export interface JourneyPreviewProps {
    id?: string; 
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
  socialMedia?: { platform: string; username: string };
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
  endDate: formData.finishDate,
  optionalQuestion: formData.optionalQuestion,
  photo: formData.photo,
  creatorAddress: formData.creatorAddress,
});
