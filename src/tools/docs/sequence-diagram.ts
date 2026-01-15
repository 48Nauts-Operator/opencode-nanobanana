/**
 * Sequence Diagram Tool
 *
 * Generates sequence diagrams from text descriptions using Gemini.
 * Supports multiple output formats: PNG (visual) or Mermaid (text-based).
 */

import { tool, type ToolDefinition } from '@opencode-ai/plugin/tool'
import { GeminiProvider } from '../../providers/gemini.js'
import { saveImage, getOutputDir } from '../../utils/file-handler.js'

/**
 * Tool args schema
 */
const sequenceDiagramArgs = {
  description: tool.schema
    .string()
    .describe('Description of the sequence/interaction flow to diagram'),
  format: tool.schema
    .enum(['png', 'mermaid'])
    .optional()
    .describe(
      'Output format: png (visual image) or mermaid (text-based code). Default: png'
    ),
  outputPath: tool.schema
    .string()
    .optional()
    .describe('Custom output path for the generated diagram'),
} as const

/**
 * Generate Mermaid sequence diagram code
 */
function generateMermaidSequence(description: string): string {
  // Extract first line or first sentence for title
  const firstLine = description.split('\n')[0] || description
  const truncatedFirstLine = firstLine.slice(0, 50)

  return `\`\`\`mermaid
sequenceDiagram
    title ${truncatedFirstLine}...

    %% Define participants
    participant User
    participant System
    participant Service
    participant Database

    %% Sequence flow - customize based on your description
    User->>System: Request
    activate System
    System->>Service: Process Request
    activate Service
    Service->>Database: Query Data
    activate Database
    Database-->>Service: Return Data
    deactivate Database
    Service-->>System: Processed Result
    deactivate Service
    System-->>User: Response
    deactivate System

    %% Notes and customization:
    %% - Replace participant names with actual actors from: ${description}
    %% - Add more participants as needed
    %% - Use ->> for synchronous calls, -->> for responses
    %% - Use activate/deactivate for execution blocks
    %% - Add 'alt', 'opt', 'loop' for control flow
    %% - Example alt: alt condition
    %%                  ...
    %%                else other condition
    %%                  ...
    %%                end
\`\`\`

**Instructions:**
1. Copy the Mermaid code above
2. Paste it into a Mermaid renderer (GitHub, Mermaid Live Editor, etc.)
3. Customize the diagram based on your sequence flow requirements

**Description provided:** ${description}
`
}

/**
 * Build prompt for Gemini
 */
function buildSequencePrompt(description: string): string {
  const basePrompt = `Create a professional sequence diagram showing the following interaction flow:\n\n${description}\n\n`

  const requirements = `Requirements:
- Clear swimlanes for each actor/system/component
- Arrows showing message flow with descriptive labels
- Time flows from top to bottom
- Include activation boxes where actors are processing
- Use different line styles for synchronous (solid) vs asynchronous (dashed) calls
- Add return messages where appropriate
- Include alt/opt/loop frames for conditional/optional/repeated flows
- Clean, professional appearance suitable for technical documentation
- Use a neutral color palette (blues, grays) with good contrast
- Label all interactions clearly
- Show any error/exception flows if relevant

Style: Technical sequence diagram following UML conventions`

  return `${basePrompt}${requirements}`
}

/**
 * Tool definition for generate_sequence_diagram
 */
export const generateSequenceDiagramTool: ToolDefinition = tool({
  description:
    'Generate a sequence diagram showing interaction flows between actors/systems. Supports visual (PNG) and text-based (Mermaid) formats for documentation.',

  args: sequenceDiagramArgs,

  async execute(args, _context) {
    try {
      const { description, format = 'png', outputPath } = args

      // Handle Mermaid format (no API key needed)
      if (format === 'mermaid') {
        const mermaidCode = generateMermaidSequence(description)

        // Save to file if outputPath provided
        if (outputPath) {
          const fs = await import('fs/promises')
          await fs.writeFile(outputPath, mermaidCode, 'utf-8')
          return `✓ Mermaid sequence diagram generated and saved to ${outputPath}\n\nYou can render this diagram on GitHub, in documentation, or using Mermaid Live Editor (https://mermaid.live).`
        }

        // Return code directly
        return `✓ Mermaid sequence diagram generated:\n\n${mermaidCode}\n\nYou can render this diagram on GitHub, in documentation, or using Mermaid Live Editor (https://mermaid.live).`
      }

      // Handle PNG format (requires Gemini API)
      const gemini = new GeminiProvider()
      const prompt = buildSequencePrompt(description)

      // Generate sequence diagram image with 16:9 aspect ratio
      const images = await gemini.generateImage(prompt, {
        aspectRatio: '16:9',
        count: 1,
      })

      if (!images || images.length === 0) {
        return '✗ Failed to generate sequence diagram image. No images returned from API.'
      }

      const imageBuffer = images[0]
      if (!imageBuffer) {
        return '✗ Failed to generate sequence diagram image. Image data is missing.'
      }

      // Save the diagram
      let savePath: string
      if (outputPath) {
        const fs = await import('fs/promises')
        const path = await import('path')
        await fs.mkdir(path.dirname(outputPath), { recursive: true })
        await fs.writeFile(outputPath, imageBuffer)
        savePath = outputPath
      } else {
        const outputDir = getOutputDir()
        savePath = await saveImage(imageBuffer, outputDir, 'sequence-diagram', 0)
      }

      return `✓ Sequence diagram generated and saved to ${savePath}`
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return '✗ Gemini API key not found. Set GEMINI_API_KEY environment variable or use format="mermaid" for text-based diagrams.'
        }
        return `✗ Failed to generate sequence diagram: ${error.message}`
      }
      return '✗ An unexpected error occurred while generating the sequence diagram.'
    }
  },
})
