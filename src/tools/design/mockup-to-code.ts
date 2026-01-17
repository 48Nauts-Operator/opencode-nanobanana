import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool';
import { GeminiProvider } from '../../providers/gemini.js';
import { loadImage } from '../../utils/file-handler.js';

export const mockupToCodeTool: ToolDefinition = tool({
  description: 'Convert design mockup images to component code. Supports React, Vue, SwiftUI, and HTML with various styling options.',
  args: {
    imagePath: tool.schema.string().describe('Path to the design mockup image'),
    framework: tool.schema.enum(['react', 'vue', 'swiftui', 'html']).describe('Target framework for code generation'),
    styling: tool.schema.enum(['tailwind', 'css', 'styled-components']).optional().describe('Styling approach (optional, defaults based on framework)'),
    componentName: tool.schema.string().optional().describe('Name for the generated component (optional)'),
  } as const,
  async execute(args, _context) {
    try {
      const { imagePath, framework, styling, componentName } = args;

      // Load the mockup image
      const imageBuffer = await loadImage(imagePath);

      // Build comprehensive prompt for code generation
      const prompt = buildCodeGenerationPrompt(framework, styling, componentName);

      // Use Gemini to analyze mockup and generate code
      const gemini = new GeminiProvider();
      const generatedCode = await gemini.analyzeImage(imageBuffer, prompt);

      // Format response
      return `✓ Code generated from mockup: ${imagePath}

Framework: ${framework}${styling ? ` with ${styling}` : ''}
${componentName ? `Component: ${componentName}\n` : ''}
${generatedCode}

Note: Review and adjust the generated code to match your project's specific requirements and coding standards.`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('API key')) {
        return '✗ Error: GEMINI_API_KEY environment variable not set. Please configure your API key.';
      }

      if (errorMessage.includes('ENOENT') || errorMessage.includes('no such file')) {
        return `✗ Error: Image file not found at path: ${args.imagePath}`;
      }

      return `✗ Error generating code from mockup: ${errorMessage}`;
    }
  }
});

/**
 * Build framework-specific code generation prompt
 */
function buildCodeGenerationPrompt(
  framework: 'react' | 'vue' | 'swiftui' | 'html',
  styling?: 'tailwind' | 'css' | 'styled-components',
  componentName?: string
): string {
  const name = componentName || getDefaultComponentName(framework);

  // Base prompt common to all frameworks
  let prompt = `Analyze this design mockup and generate clean, production-ready code that accurately recreates the design.

Component Name: ${name}

Focus on:
1. Accurate layout and spacing
2. Exact colors, fonts, and styling
3. Proper component structure and hierarchy
4. Semantic HTML/markup
5. Responsive design considerations
6. Accessibility (ARIA labels, semantic tags)

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
- Follow responsive design patterns (sm:, md:, lg:, xl:)
- Use semantic color names from the design
- Implement proper spacing with Tailwind's spacing scale

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
- Use theme variables where appropriate
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
- Implement proper spacing with padding, spacing in VStack/HStack
- Use Color and Font from SwiftUI
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
      return 'DesignComponent';
    case 'swiftui':
      return 'DesignView';
    case 'html':
      return 'design-component';
  }
}
