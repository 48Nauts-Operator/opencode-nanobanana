import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { loadImage } from '../../utils/file-handler.js';

export const sketchToCodeTool: ToolDefinition = tool({
  description: 'Convert hand-drawn sketches and rough wireframes to component code. Interprets sketchy, imprecise designs and generates production-ready code.',
  args: {
    imagePath: tool.schema.string().describe('Path to the sketch or wireframe image'),
    framework: tool.schema.enum(['react', 'vue', 'swiftui', 'html']).describe('Target framework for code generation'),
    styling: tool.schema.enum(['tailwind', 'css', 'styled-components']).optional().describe('Styling approach (optional, defaults based on framework)'),
    componentName: tool.schema.string().optional().describe('Name for the generated component (optional)'),
  } as const,
  async execute(args, _context) {
    try {
      const { imagePath, framework, styling, componentName } = args;

      // Load the sketch image
      const imageBuffer = await loadImage(imagePath);

      // Build comprehensive prompt for code generation from sketch
      const prompt = buildSketchCodePrompt(framework, styling, componentName);

      // Use Gemini to analyze sketch and generate code
      const gemini = new GeminiProvider();
      const generatedCode = await gemini.analyzeImage(imageBuffer, prompt);

      // Format response
      return `✓ Code generated from sketch: ${imagePath}

Framework: ${framework}${styling ? ` with ${styling}` : ''}
${componentName ? `Component: ${componentName}\n` : ''}
${generatedCode}

Note: The code was generated from a sketch/wireframe. Review and refine the implementation to match your exact requirements.`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('API key')) {
        return '✗ Error: GEMINI_API_KEY environment variable not set. Please configure your API key.';
      }

      if (errorMessage.includes('ENOENT') || errorMessage.includes('no such file')) {
        return `✗ Error: Image file not found at path: ${args.imagePath}`;
      }

      return `✗ Error generating code from sketch: ${errorMessage}`;
    }
  }
});

/**
 * Build framework-specific code generation prompt for sketches
 */
function buildSketchCodePrompt(
  framework: 'react' | 'vue' | 'swiftui' | 'html',
  styling?: 'tailwind' | 'css' | 'styled-components',
  componentName?: string
): string {
  const name = componentName || getDefaultComponentName(framework);

  // Base prompt specifically for hand-drawn/rough sketches
  let prompt = `Analyze this hand-drawn sketch or rough wireframe and generate clean, production-ready code.

Component Name: ${name}

IMPORTANT: This is a sketch/wireframe, not a polished design mockup. Interpret the intent:
1. Boxes and rectangles represent containers/sections
2. Lines and scribbles represent text content
3. Circles or rounded shapes may represent buttons, icons, or avatars
4. Hand-drawn elements should be converted to proper UI components
5. Rough spacing should be translated to proper layout spacing
6. Assume standard UI patterns where the sketch is ambiguous

Focus on:
1. Interpreting the layout structure and component hierarchy
2. Using semantic component types (header, nav, button, card, etc.)
3. Applying sensible defaults for colors (use neutral/modern palette)
4. Implementing proper spacing and alignment
5. Making the design responsive
6. Following accessibility best practices

`;

  // Framework-specific instructions
  switch (framework) {
    case 'react':
      prompt += generateReactPrompt(styling || 'tailwind', name);
      break;
    case 'vue':
      prompt += generateVuePrompt(styling || 'css', name);
      break;
    case 'swiftui':
      prompt += generateSwiftUIPrompt(name);
      break;
    case 'html':
      prompt += generateHTMLPrompt(styling || 'css', name);
      break;
  }

  prompt += `\n\nProvide only the code - no explanations or markdown formatting unless it's part of comments in the code.`;

  return prompt;
}

/**
 * Generate React-specific prompt
 */
function generateReactPrompt(styling: string, componentName: string): string {
  let prompt = `Generate React code with TypeScript.

`;

  if (styling === 'tailwind') {
    prompt += `Use Tailwind CSS for styling:
- Use Tailwind utility classes
- Apply modern, neutral color palette (gray-50 through gray-900, blue for primary actions)
- Follow responsive design patterns (sm:, md:, lg:, xl:)
- Implement proper spacing with Tailwind's spacing scale
- Use rounded corners and shadows for depth where appropriate

Example structure:
\`\`\`tsx
interface ${componentName}Props {
  // Define props here
}

export function ${componentName}({ }: ${componentName}Props) {
  return (
    <div className="...">
      {/* Component content */}
    </div>
  );
}
\`\`\``;
  } else if (styling === 'styled-components') {
    prompt += `Use styled-components for styling:
- Create styled components for each major element
- Use modern, neutral color palette
- Implement responsive styles with media queries
- Follow CSS-in-JS best practices

Example structure:
\`\`\`tsx
import styled from 'styled-components';

const Container = styled.div\`
  /* styles */
\`;

interface ${componentName}Props {
  // Define props here
}

export function ${componentName}({ }: ${componentName}Props) {
  return (
    <Container>
      {/* Component content */}
    </Container>
  );
}
\`\`\``;
  } else {
    prompt += `Use CSS Modules for styling:
- Create separate styles object
- Use className for styling
- Implement BEM naming convention
- Include responsive media queries
- Apply modern, neutral color palette

Example structure:
\`\`\`tsx
import styles from './${componentName}.module.css';

interface ${componentName}Props {
  // Define props here
}

export function ${componentName}({ }: ${componentName}Props) {
  return (
    <div className={styles.container}>
      {/* Component content */}
    </div>
  );
}
\`\`\``;
  }

  return prompt;
}

/**
 * Generate Vue-specific prompt
 */
function generateVuePrompt(styling: string, componentName: string): string {
  let prompt = `Generate Vue 3 code with TypeScript and Composition API.

`;

  if (styling === 'tailwind') {
    prompt += `Use Tailwind CSS for styling:
- Use Tailwind utility classes in template
- Apply modern, neutral color palette
- Follow Vue 3 best practices
- Use <script setup> syntax

Example structure:
\`\`\`vue
<template>
  <div class="...">
    <!-- Component content -->
  </div>
</template>

<script setup lang="ts">
interface ${componentName}Props {
  // Define props here
}

defineProps<${componentName}Props>();
</script>
\`\`\``;
  } else {
    prompt += `Use scoped CSS for styling:
- Use <style scoped> for component-specific styles
- Apply modern, neutral color palette
- Follow Vue 3 best practices
- Use <script setup> syntax

Example structure:
\`\`\`vue
<template>
  <div class="container">
    <!-- Component content -->
  </div>
</template>

<script setup lang="ts">
interface ${componentName}Props {
  // Define props here
}

defineProps<${componentName}Props>();
</script>

<style scoped>
.container {
  /* styles */
}
</style>
\`\`\``;
  }

  return prompt;
}

/**
 * Generate SwiftUI-specific prompt
 */
function generateSwiftUIPrompt(componentName: string): string {
  return `Generate SwiftUI code for iOS/macOS.

- Use SwiftUI Views and Modifiers
- Apply system colors and fonts for a native look
- Implement proper spacing with padding, spacing in VStack/HStack
- Follow Apple's Human Interface Guidelines
- Make the component reusable with proper parameters

Example structure:
\`\`\`swift
import SwiftUI

struct ${componentName}: View {
    // Define properties here

    var body: some View {
        VStack {
            // Component content
        }
    }
}

#Preview {
    ${componentName}()
}
\`\`\``;
}

/**
 * Generate HTML-specific prompt
 */
function generateHTMLPrompt(styling: string, _componentName: string): string {
  let prompt = `Generate semantic HTML5 code.

`;

  if (styling === 'tailwind') {
    prompt += `Use Tailwind CSS for styling:
- Use Tailwind utility classes
- Apply modern, neutral color palette
- Follow responsive design patterns
- Use semantic HTML5 tags

Example structure:
\`\`\`html
<div class="...">
  <!-- Component content -->
</div>
\`\`\``;
  } else {
    prompt += `Use custom CSS for styling:
- Use semantic HTML5 tags
- Include CSS in <style> block
- Follow BEM naming convention
- Apply modern, neutral color palette
- Implement responsive design with media queries

Example structure:
\`\`\`html
<div class="component">
  <!-- Component content -->
</div>

<style>
.component {
  /* styles */
}
</style>
\`\`\``;
  }

  return prompt;
}

/**
 * Get default component name based on framework
 */
function getDefaultComponentName(framework: 'react' | 'vue' | 'swiftui' | 'html'): string {
  switch (framework) {
    case 'react':
    case 'vue':
      return 'SketchComponent';
    case 'swiftui':
      return 'SketchView';
    case 'html':
      return 'sketch-component';
  }
}
