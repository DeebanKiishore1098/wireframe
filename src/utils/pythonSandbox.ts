// ============================================================
// PYTHON SANDBOX — Static analysis for LLM-generated scripts
//
// Defence-in-depth against RCE via prompt-injected Python.
// Every LLM-generated script is validated here before being
// written to disk or executed. This does NOT replace OS-level
// sandboxing but raises the bar against the most common attack
// vectors: shell execution, network calls, dynamic code eval,
// and introspection abuse.
// ============================================================

export interface SandboxValidationResult {
  safe: boolean;
  violations: string[];
}

// ── Dangerous call / attribute patterns ─────────────────────
// Checked against the full script body regardless of how
// they were imported.
const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  // Shell / process execution via os module
  { pattern: /\bos\.system\s*\(/,             description: 'os.system() call detected' },
  { pattern: /\bos\.popen\s*\(/,              description: 'os.popen() call detected' },
  { pattern: /\bos\.exec[lv]p?\s*\(/,         description: 'os.exec*() call detected' },
  { pattern: /\bos\.spawn[lv]p?\s*\(/,        description: 'os.spawn*() call detected' },
  { pattern: /\bos\.fork\s*\(/,               description: 'os.fork() call detected' },
  { pattern: /\bos\.kill\s*\(/,               description: 'os.kill() call detected' },
  { pattern: /\bos\.remove\s*\(/,             description: 'os.remove() call detected' },
  { pattern: /\bos\.unlink\s*\(/,             description: 'os.unlink() call detected' },
  { pattern: /\bos\.rmdir\s*\(/,              description: 'os.rmdir() call detected' },

  // Dynamic code execution — the most dangerous class
  { pattern: /(?<![.\w])eval\s*\(/,           description: 'eval() call detected' },
  { pattern: /(?<![.\w])exec\s*\(/,           description: 'exec() call detected' },
  { pattern: /(?<![.\w])compile\s*\(/,        description: 'compile() call detected' },
  { pattern: /\b__import__\s*\(/,             description: '__import__() call detected' },
  { pattern: /\bexecfile\s*\(/,               description: 'execfile() call detected' },

  // Introspection / dunder abuse (MRO chain attacks)
  { pattern: /\b__builtins__\b/,              description: '__builtins__ access detected' },
  { pattern: /\b__globals__\b/,               description: '__globals__ access detected' },
  { pattern: /\b__subclasses__\s*\(/,         description: '__subclasses__() call detected' },
  { pattern: /\b__class__\s*\.\s*__mro__\b/,  description: '__class__.__mro__ access detected' },
  { pattern: /getattr\s*\([^)]*,\s*['"]__/,   description: 'getattr() targeting dunder attribute' },
  { pattern: /(?<![.\w])globals\s*\(\s*\)/,   description: 'globals() call detected' },
  { pattern: /(?<![.\w])locals\s*\(\s*\)/,    description: 'locals() call detected' },
  { pattern: /(?<![.\w])vars\s*\(\s*\)/,      description: 'vars() call detected' },

  // Blocked module imports — network
  { pattern: /\bimport\s+socket\b/,           description: 'socket module import blocked' },
  { pattern: /\bfrom\s+socket\b/,             description: 'socket module import blocked' },
  { pattern: /\bimport\s+urllib\b/,           description: 'urllib module import blocked' },
  { pattern: /\bfrom\s+urllib\b/,             description: 'urllib module import blocked' },
  { pattern: /\bimport\s+requests\b/,         description: 'requests module import blocked' },
  { pattern: /\bimport\s+httpx\b/,            description: 'httpx module import blocked' },
  { pattern: /\bimport\s+aiohttp\b/,          description: 'aiohttp module import blocked' },
  { pattern: /\bimport\s+http\b/,             description: 'http module import blocked' },
  { pattern: /\bfrom\s+http\b/,               description: 'http module import blocked' },
  { pattern: /\bimport\s+ftplib\b/,           description: 'ftplib module import blocked' },
  { pattern: /\bimport\s+smtplib\b/,          description: 'smtplib module import blocked' },
  { pattern: /\bimport\s+paramiko\b/,         description: 'paramiko module import blocked' },

  // Blocked module imports — process / shell execution
  { pattern: /\bimport\s+subprocess\b/,       description: 'subprocess module import blocked' },
  { pattern: /\bfrom\s+subprocess\b/,         description: 'subprocess module import blocked' },
  { pattern: /\bimport\s+multiprocessing\b/,  description: 'multiprocessing module import blocked' },
  { pattern: /\bimport\s+threading\b/,        description: 'threading module import blocked' },
  { pattern: /\bimport\s+pty\b/,              description: 'pty module import blocked' },
  { pattern: /\bimport\s+signal\b/,           description: 'signal module import blocked' },

  // Blocked module imports — code / reflection
  { pattern: /\bimport\s+importlib\b/,        description: 'importlib module import blocked' },
  { pattern: /\bfrom\s+importlib\b/,          description: 'importlib module import blocked' },
  { pattern: /\bimport\s+ast\b/,              description: 'ast module import blocked' },
  { pattern: /\bimport\s+dis\b/,              description: 'dis module import blocked' },
  { pattern: /\bimport\s+inspect\b/,          description: 'inspect module import blocked' },
  { pattern: /\bimport\s+code\b/,             description: 'code module import blocked' },
  { pattern: /\bimport\s+imp\b/,              description: 'imp module import blocked' },

  // Blocked module imports — serialisation (deserialization attacks)
  { pattern: /\bimport\s+pickle\b/,           description: 'pickle module import blocked' },
  { pattern: /\bfrom\s+pickle\b/,             description: 'pickle module import blocked' },
  { pattern: /\bimport\s+marshal\b/,          description: 'marshal module import blocked' },
  { pattern: /\bimport\s+shelve\b/,           description: 'shelve module import blocked' },
  { pattern: /\bimport\s+dill\b/,             description: 'dill module import blocked' },

  // Blocked module imports — ffi / native code
  { pattern: /\bimport\s+ctypes\b/,           description: 'ctypes module import blocked' },
  { pattern: /\bfrom\s+ctypes\b/,             description: 'ctypes module import blocked' },
  { pattern: /\bimport\s+cffi\b/,             description: 'cffi module import blocked' },

  // Blocked module imports — file system manipulation
  { pattern: /\bimport\s+shutil\b/,           description: 'shutil module import blocked' },
  { pattern: /\bimport\s+glob\b/,             description: 'glob module import blocked' },
  { pattern: /\bimport\s+tempfile\b/,         description: 'tempfile module import blocked' },

  // Obfuscation techniques (base64-encoded payloads)
  { pattern: /\bbase64\.b64decode\s*\(/,       description: 'base64.b64decode() call detected (possible obfuscation)' },
  { pattern: /\bbinascii\.a2b/,               description: 'binascii decode call detected (possible obfuscation)' },
  { pattern: /\bzlib\.decompress\s*\(/,        description: 'zlib.decompress() call detected (possible obfuscation)' },
];

/**
 * Validates a generated Python script for unsafe patterns before execution.
 *
 * Returns `safe: false` with a list of violations if anything dangerous is
 * found. The caller should abort execution and log all violations.
 *
 * This validator is a defence-in-depth layer. It covers the most common
 * prompt-injection RCE vectors (shell execution, network calls, eval/exec,
 * introspection abuse, banned module imports).
 */
export function validatePythonScript(script: string): SandboxValidationResult {
  if (!script || typeof script !== 'string') {
    return { safe: false, violations: ['Script is empty or not a string'] };
  }

  // Reject scripts that are suspiciously short (< 20 chars) or huge (> 500 KB)
  if (script.trim().length < 20) {
    return { safe: false, violations: ['Script is too short to be valid'] };
  }
  if (Buffer.byteLength(script, 'utf8') > 512 * 1024) {
    return { safe: false, violations: ['Script exceeds 512 KB size limit'] };
  }

  // Require the script to contain a python-pptx import — if it's missing,
  // the script isn't doing what we expect.
  if (!/\bfrom\s+pptx\b|\bimport\s+pptx\b/.test(script)) {
    return { safe: false, violations: ['Script does not import python-pptx — unexpected content'] };
  }

  // Require argparse --output usage (our execution contract)
  if (!/argparse|--output/.test(script)) {
    return { safe: false, violations: ['Script does not use argparse --output — unexpected content'] };
  }

  const violations: string[] = [];

  for (const { pattern, description } of DANGEROUS_PATTERNS) {
    if (pattern.test(script)) {
      violations.push(description);
    }
  }

  return { safe: violations.length === 0, violations };
}

/** Hard timeout for Python script execution: 2 minutes. */
export const PYTHON_EXEC_TIMEOUT_MS = 120_000;

// ── Python executable resolver ───────────────────────────────
// Windows machines often have 'py' (Python Launcher) or 'python3'
// in PATH instead of 'python'. Detect once and cache.

let _resolvedPython: string | null = null;

/**
 * Returns the first Python executable found in PATH.
 * Tries (in order): 'py', 'python3', 'python'.
 * Throws if none is available.
 */
export async function resolvePythonExecutable(): Promise<string> {
  if (_resolvedPython) return _resolvedPython;

  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  const candidates = ['py', 'python3', 'python'];

  for (const cmd of candidates) {
    try {
      const { stdout } = await execAsync(`${cmd} --version`, { timeout: 5_000 });
      const version = stdout.trim();
      console.log(`[PythonResolver] Found: ${cmd} → ${version}`);
      _resolvedPython = cmd;
      return cmd;
    } catch {
      // not available, try next
    }
  }

  throw new Error(
    `No Python interpreter found. Install Python and ensure 'py', 'python3', or 'python' is accessible on PATH.`
  );
}
