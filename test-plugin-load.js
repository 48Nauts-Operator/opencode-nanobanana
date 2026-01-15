#!/usr/bin/env node
/**
 * Test script to verify OpenCode Visual Toolkit plugin loads correctly
 */

import VisualToolkitPlugin from './dist/index.js';

console.log('🧪 Testing OpenCode Visual Toolkit Plugin Load...\n');

try {
  // Check plugin structure
  console.log('✓ Plugin imported successfully');
  console.log('  Plugin is async function:', typeof VisualToolkitPlugin === 'function');

  // Initialize the plugin (it's an async function)
  console.log('\n🔄 Initializing plugin...\n');
  const pluginInstance = await VisualToolkitPlugin({});

  // Count tools
  const tools = pluginInstance.tool || {};
  const toolCount = Object.keys(tools).length;
  console.log(`\n✓ Plugin has ${toolCount} tools registered:`);

  // List all tools with descriptions
  Object.entries(tools).forEach(([name, tool]) => {
    console.log(`  • ${name}`);
    if (tool.description) {
      const desc = tool.description.substring(0, 70);
      console.log(`    ${desc}${desc.length < tool.description.length ? '...' : ''}`);
    }
  });

  console.log('\n✅ Plugin loaded successfully!\n');
  console.log('To use in OpenCode Desktop:');
  console.log('  1. Restart OpenCode Desktop app');
  console.log('  2. Tools will be available automatically');
  console.log('  3. Try: "Generate a modern app icon"');
  console.log('  4. Or: "Create iOS app icons with a blue rocket"');

  process.exit(0);
} catch (error) {
  console.error('❌ Plugin failed to load:', error.message);
  console.error(error.stack);
  process.exit(1);
}
