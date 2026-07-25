import { Button } from "@/components/ui/button"
import { ProofNameEnum } from '@/interfaces/ProofItem';
import Image from 'next/image';

interface ProofSelectorProps {
  filters: Array<{
    id: string;
    icon: string;
    color: string;
    proofEnum: ProofNameEnum;
  }>;
  onProofClick: (proofEnum: ProofNameEnum) => void;
  isProofRequired: (proofEnum: ProofNameEnum) => boolean;
  isProofCustom: (proofEnum: ProofNameEnum) => boolean;
}

export const ProofSelector = ({
  filters,
  onProofClick,
  isProofRequired,
  isProofCustom
}: ProofSelectorProps) => {
  return (
    <div className="clay-surface clay-tone-sky px-4 py-4">
      <div className="grid grid-cols-8 gap-2 mt-2">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant="claySecondary"
            className={`relative aspect-square h-11 min-h-11 rounded-[16px] p-1 ${
              isProofRequired(filter.proofEnum)
                ? 'ring-2 ring-orange-500'
                : isProofCustom(filter.proofEnum)
                ? 'ring-2 ring-blue-500'
                : ''
            }`}
            onClick={() => onProofClick(filter.proofEnum)}
          >
            <div className={`w-full h-full rounded-md ${filter.color} flex items-center justify-center relative`}>
              <Image src={filter.icon} alt={filter.id} width={56} height={32} className="w-14 h-8" />
              {isProofRequired(filter.proofEnum) && (
                <div className="absolute -top-1 -right-1 z-10">
                  <Image src="/icons/lock.png" alt="Required" width={16} height={16} />
                </div>
              )}
            </div>
          </Button>
        ))}
      </div>
      <p className="mt-3 text-xs font-medium text-clay-muted">
        Click once to add as optional, click again to make it required 🔒, and once more to remove
      </p>
    </div>
  );
};
