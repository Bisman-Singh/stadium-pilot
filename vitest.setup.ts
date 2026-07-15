import "@testing-library/jest-dom/vitest";
import * as axeMatchers from "vitest-axe/matchers";
import { expect } from "vitest";

// Adds `toHaveNoViolations()` for accessibility assertions.
expect.extend(axeMatchers);
