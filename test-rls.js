#!/usr/bin/env node
/**
 * Supabase RLS Security Test Script
 *
 * Tests Row Level Security (RLS) on all Supabase tables
 * Verifies that unauthenticated users cannot access any data
 *
 * Expected result: All tables should return 0 rows (RLS blocking access)
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables from frontend/.env
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, 'frontend/.env') })

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const { bright, red, green, yellow, blue, cyan, reset } = colors

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Tables to test
const TABLES = [
  'profiles',
  'workspaces',
  'conversations',
  'messages',
  'graph_nodes',
  'graph_edges'
]

/**
 * Test RLS on a single table
 */
async function testTable(supabase, tableName) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })

    if (error) {
      // If we get a permission error, that's actually good (RLS is working)
      if (error.code === 'PGRST301' || error.message.includes('permission')) {
        return {
          table: tableName,
          success: true,
          rowCount: 0,
          status: 'SECURED',
          message: 'Permission denied (RLS active)'
        }
      }

      return {
        table: tableName,
        success: false,
        rowCount: null,
        status: 'ERROR',
        message: error.message
      }
    }

    // If we can query without error, check if we got any rows
    const rowCount = count || 0
    const isSecure = rowCount === 0

    return {
      table: tableName,
      success: isSecure,
      rowCount,
      status: isSecure ? 'SECURED' : 'VULNERABLE',
      message: isSecure
        ? 'No rows accessible (RLS active)'
        : `⚠️  ${rowCount} rows accessible without auth!`
    }

  } catch (err) {
    return {
      table: tableName,
      success: false,
      rowCount: null,
      status: 'ERROR',
      message: err.message
    }
  }
}

/**
 * Main test function
 */
async function runRLSTests() {
  console.log('\n' + bright + cyan + '═══════════════════════════════════════════════════════' + reset)
  console.log(bright + cyan + '   🔒 SUPABASE ROW LEVEL SECURITY (RLS) TEST' + reset)
  console.log(bright + cyan + '═══════════════════════════════════════════════════════' + reset + '\n')

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(red + '❌ Error: Missing Supabase credentials!' + reset)
    console.error(yellow + 'Required environment variables:' + reset)
    console.error('  - VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
    console.error('  - VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY\n')
    process.exit(1)
  }

  console.log(blue + '📋 Test Configuration:' + reset)
  console.log(`   URL: ${supabaseUrl}`)
  console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...`)
  console.log(`   Auth: ${yellow}NONE (testing unauthenticated access)${reset}\n`)

  // Create Supabase client WITHOUT authentication
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  console.log(blue + '🧪 Testing RLS on tables:' + reset)
  console.log(`   ${TABLES.join(', ')}\n`)
  console.log(cyan + '─────────────────────────────────────────────────────────' + reset + '\n')

  // Test each table
  const results = []
  for (const table of TABLES) {
    process.stdout.write(`   Testing ${bright}${table}${reset}... `)

    const result = await testTable(supabase, table)
    results.push(result)

    // Print result
    if (result.success) {
      console.log(green + '✅ SECURED' + reset)
      console.log(`      ${result.message}`)
    } else {
      console.log(red + '❌ ' + result.status + reset)
      console.log(`      ${result.message}`)
    }
    console.log('')
  }

  // Summary
  console.log(cyan + '─────────────────────────────────────────────────────────' + reset + '\n')

  const securedCount = results.filter(r => r.success).length
  const totalCount = results.length
  const allSecured = securedCount === totalCount

  if (allSecured) {
    console.log(green + bright + '✅ ALL TABLES SECURED!' + reset)
    console.log(green + `   ${securedCount}/${totalCount} tables have RLS properly configured` + reset)
    console.log(green + '   No data accessible without authentication' + reset + '\n')
  } else {
    console.log(red + bright + '❌ SECURITY ISSUES DETECTED!' + reset)
    console.log(red + `   Only ${securedCount}/${totalCount} tables properly secured` + reset)
    console.log(red + '   Some tables may be exposing data!' + reset + '\n')

    // Show vulnerable tables
    const vulnerableTables = results.filter(r => !r.success)
    console.log(yellow + '⚠️  Tables with issues:' + reset)
    vulnerableTables.forEach(r => {
      console.log(`   - ${r.table}: ${r.message}`)
    })
    console.log('')
  }

  // Detailed summary table
  console.log(blue + '📊 Detailed Results:' + reset + '\n')
  console.log('   ' + bright + 'Table'.padEnd(20) + 'Status'.padEnd(15) + 'Rows'.padEnd(10) + 'Message' + reset)
  console.log(cyan + '   ' + '─'.repeat(70) + reset)

  results.forEach(r => {
    const statusColor = r.success ? green : red
    const statusIcon = r.success ? '✅' : '❌'
    const rowCount = r.rowCount !== null ? r.rowCount.toString() : 'N/A'

    console.log(
      '   ' +
      r.table.padEnd(20) +
      statusColor + statusIcon + ' ' + r.status.padEnd(13) + reset +
      rowCount.padEnd(10) +
      r.message
    )
  })

  console.log('\n' + cyan + '═══════════════════════════════════════════════════════' + reset + '\n')

  // Exit with appropriate code
  process.exit(allSecured ? 0 : 1)
}

// Run the tests
runRLSTests().catch(err => {
  console.error(red + '\n❌ Fatal Error:' + reset, err.message)
  console.error(err.stack)
  process.exit(1)
})
