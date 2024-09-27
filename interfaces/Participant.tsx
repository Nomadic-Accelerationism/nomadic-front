import { ParticipantVerification } from "./ParticipantVerification"

export interface Participant {
    id: number
    name: string
    status: 'Confirmed' | 'Approved' | 'Pending' | 'Not Selected'
    points: number
    maxPoints: number
    verifications?: ParticipantVerification[]
  }