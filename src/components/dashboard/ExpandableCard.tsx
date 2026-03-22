import { useState, type ReactNode } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Maximize2 } from "lucide-react";

interface ExpandableCardProps {
  children: ReactNode;
  title?: string;
}

export default function ExpandableCard({ children, title }: ExpandableCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="relative group">
        <button
          onClick={() => setOpen(true)}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-md border border-border bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all opacity-0 group-hover:opacity-100"
          title={title ? `Expand ${title}` : "Expand"}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        {children}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] overflow-y-auto p-0 gap-0">
          <div className="[&_.recharts-responsive-container]:!h-[500px] [&_svg.w-full]:!max-w-none [&_svg.w-full]:!w-full [&_svg.w-full]:!h-auto">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
