import React, { useState } from "react";
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { CodeBlock, dracula, github } from "react-code-blocks";
import { Button } from "./ui/button";
import { toast } from "sonner";

export default function CodeDisplayBlock({ code, lang }) {
  const [isCopied, setIsCopied] = useState(false);
  const [theme, setTheme] = useState("light");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  };

  return (
    <div className="relative flex flex-col text-start">
      <Button
        onClick={copyToClipboard}
        variant="ghost"
        size="icon"
        className="h-5 w-5 absolute top-2 right-2"
      >
        {isCopied ? (
          <CheckIcon className="w-4 h-4 scale-100 transition-all" />
        ) : (
          <CopyIcon className="w-4 h-4 scale-100 transition-all" />
        )}
      </Button>
      <CodeBlock
        customStyle={
          theme === "dark"
            ? { background: "#303033" }
            : { background: "#fcfcfc" }
        }
        text={code}
        language={lang}
        showLineNumbers={false}
        theme={theme === "dark" ? dracula : github}
      />
    </div>
  );
}
