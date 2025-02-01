import { ProofNameEnum } from '@/interfaces/ProofItem';
import { JourneyFormData } from '@/interfaces/Journey';
import { useState, useCallback } from 'react'

interface UseProofSelectionProps {
  initialRequiredProofs?: ProofNameEnum[];
  initialCustomProofs?: ProofNameEnum[];
}

interface UseProofSelectionReturn {
  formData: Pick<JourneyFormData, 'requiredProofs' | 'customProofs'>;
  handleProofClick: (proofEnum: ProofNameEnum) => void;
  isProofRequired: (proofEnum: ProofNameEnum) => boolean;
  isProofCustom: (proofEnum: ProofNameEnum) => boolean;
}

export const useProofSelection = ({
  initialRequiredProofs = [],
  initialCustomProofs = []
}: UseProofSelectionProps = {}): UseProofSelectionReturn => {
  const [proofState, setProofState] = useState<Pick<JourneyFormData, 'requiredProofs' | 'customProofs'>>({
    requiredProofs: initialRequiredProofs,
    customProofs: initialCustomProofs
  });

  const handleProofClick = useCallback((proofEnum: ProofNameEnum) => {
    setProofState(prev => {
      const isInRequired = prev.requiredProofs.includes(proofEnum);
      const isInCustom = prev.customProofs.includes(proofEnum);

      if (!isInRequired && !isInCustom) {
        return {
          ...prev,
          customProofs: [...prev.customProofs, proofEnum]
        };
      } else if (isInCustom) {
        return {
          ...prev,
          customProofs: prev.customProofs.filter(p => p !== proofEnum),
          requiredProofs: [...prev.requiredProofs, proofEnum]
        };
      } else {
        return {
          ...prev,
          requiredProofs: prev.requiredProofs.filter(p => p !== proofEnum)
        };
      }
    });
  }, []);

  const isProofRequired = useCallback((proofEnum: ProofNameEnum) => 
    proofState.requiredProofs.includes(proofEnum), [proofState.requiredProofs]);

  const isProofCustom = useCallback((proofEnum: ProofNameEnum) => 
    proofState.customProofs.includes(proofEnum), [proofState.customProofs]);

  return {
    formData: proofState,
    handleProofClick,
    isProofRequired,
    isProofCustom
  };
};