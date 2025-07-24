import * as React from "react";

export function useTemplate(defaultTemplate: string = "classic") {
  const [selected, setSelected] = React.useState<string>(defaultTemplate);
  return {
    selected,
    setSelected,
  };
}
