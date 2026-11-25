import { createContext } from "react";

/**
 * Whatever renders inside a sheet knows it: a select's list opens in the
 * sheet's flow instead of floating over it. A file of its own, so the select
 * does not have to load the sheet's drag library.
 */
export const InsideSheetContext = createContext(false);
