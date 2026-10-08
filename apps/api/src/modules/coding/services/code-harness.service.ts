import { Injectable } from "@nestjs/common";

/**
 * How test input is written to the program's stdin.
 *
 * - "json": the harness appended its own driver, which reads one JSON value
 *   from stdin. Types survive exactly ([1] stays a list, "5" stays a string).
 * - "legacy": the candidate's code reads stdin itself (own main / sys.stdin),
 *   so input is sent in the plain whitespace/line format it was written for.
 */
export type StdinMode = "json" | "legacy";

export interface PreparedProgram {
  sourceCode: string;
  stdinMode: StdinMode;
}

/** One test case's outcome as reported by a multi-case driver. */
export interface MultiCaseOutput {
  status: "ok" | "error" | "tle" | "mle" | "skipped";
  /** The formatted return value, or the captured prints for void functions. */
  output: string;
  /** Everything the candidate printed during this case. */
  printed: string;
  error: string;
  timeMs: number;
}

type HarnessLanguage = "java" | "python" | "other";

/**
 * Turns a candidate's function-style solution into a complete program Judge0
 * can run, and formats each test input for that program's stdin.
 *
 * Judge0 runs code as a standalone program (Java: `Main.java` → `java Main`),
 * but candidates only write a function or a `Solution` class. The driver this
 * service appends reads the test input, calls the candidate's function and
 * prints the result in the format compareOutputs() expects (plain scalars,
 * compact JSON for arrays/lists/maps).
 */
@Injectable()
export class CodeHarnessService {
  prepare(code: string, language: string | number): PreparedProgram {
    const source = code ?? "";
    switch (this.detectLanguage(language)) {
      case "java":
        return this.prepareJava(source);
      case "python":
        return this.preparePython(source);
      default:
        return { sourceCode: source, stdinMode: "legacy" };
    }
  }

  buildStdin(input: any, mode: StdinMode): string {
    if (mode === "json") {
      return JSON.stringify(this.toJsonValue(input) ?? null);
    }
    return this.formatLegacyStdin(input);
  }

  /**
   * Stdin for running every test case in one execution. Only valid for
   * programs prepared in "json" mode (the generated drivers understand it).
   * The nonce marks the driver's result lines; it travels in stdin, which the
   * driver consumes before calling candidate code.
   */
  buildMultiCaseStdin(inputs: any[], nonce: string, caseTimeoutMs: number): string {
    return JSON.stringify({
      __iv_multi__: true,
      nonce,
      caseTimeoutMs,
      cases: inputs.map((input) => this.toJsonValue(input) ?? null),
    });
  }

  /** One entry per test case; null where the program died before reporting it. */
  parseMultiCaseOutput(stdout: string, nonce: string, count: number): (MultiCaseOutput | null)[] {
    const outputs: (MultiCaseOutput | null)[] = new Array(count).fill(null);
    for (const line of (stdout || "").split("\n")) {
      if (!line.startsWith(nonce)) continue;
      try {
        const entry = JSON.parse(line.slice(nonce.length));
        const index = Number(entry?.i);
        if (!Number.isInteger(index) || index < 0 || index >= count) continue;
        outputs[index] = {
          status: entry.s,
          output: String(entry.o ?? ""),
          printed: String(entry.p ?? ""),
          error: String(entry.e ?? ""),
          timeMs: Number(entry.ms) || 0,
        };
      } catch {
        // ignore malformed lines
      }
    }
    return outputs;
  }

  private detectLanguage(language: string | number): HarnessLanguage {
    const lang = String(language ?? "").trim().toLowerCase();
    // "javascript" contains "java", so it must be excluded explicitly.
    if (lang.includes("javascript")) return "other";
    if (lang === "62" || lang === "openjdk" || lang.includes("java")) return "java";
    if (lang === "71" || lang === "py" || lang.includes("python")) return "python";
    return "other";
  }

  private toJsonValue(input: any): any {
    if (typeof input === "string") {
      const trimmed = input.trim();
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }
    return input;
  }

  // ─── Python ─────────────────────────────────────────────────────────────────

  private preparePython(code: string): PreparedProgram {
    let source = code;
    if (!source.includes("__future__")) {
      source = "from __future__ import annotations\n" + source;
    }

    const hasOwnEntryPoint = source.includes("__main__") || source.includes("sys.stdin");
    if (hasOwnEntryPoint) {
      return { sourceCode: source, stdinMode: "legacy" };
    }

    // First public def: a top-level function, or a method of a LeetCode-style
    // `class Solution` (resolved at runtime by the driver).
    const match = source.match(/def\s+([A-Za-z][A-Za-z0-9_]*)\s*\(/);
    const funcName = match?.[1] || "solution";

    return { sourceCode: source + this.pythonDriver(funcName), stdinMode: "json" };
  }

  private pythonDriver(funcName: string): string {
    return `

if __name__ == "__main__":
    import sys as _iv_sys, json as _iv_json, inspect as _iv_inspect
    _iv_raw = _iv_sys.stdin.read().strip()
    try:
        _iv_val = _iv_json.loads(_iv_raw) if _iv_raw else None
    except Exception:
        _iv_val = int(_iv_raw) if _iv_raw.lstrip("-").isdigit() else _iv_raw

    def _iv_get_fn():
        fn = globals().get("${funcName}")
        if fn is None and "Solution" in globals():
            fn = getattr(globals()["Solution"](), "${funcName}")
        return fn

    def _iv_call(fn, val):
        try:
            params = list(_iv_inspect.signature(fn).parameters.values())
        except (TypeError, ValueError):
            params = []
        names = [p.name for p in params]
        arity = len(params)
        if val is None and arity == 0:
            return fn()
        if isinstance(val, dict) and val and all(k in names for k in val):
            return fn(**val)
        if isinstance(val, dict) and len(val) == arity:
            return fn(*val.values())
        if isinstance(val, list) and arity > 1 and len(val) == arity:
            return fn(*val)
        return fn(val)

    def _iv_fmt(res):
        if isinstance(res, bool):
            return str(res).lower()
        if isinstance(res, (dict, list, tuple)):
            return _iv_json.dumps(res, separators=(",", ":"))
        return None if res is None else str(res)

    if isinstance(_iv_val, dict) and _iv_val.get("__iv_multi__") is True:
        # Every test case of a Run/Submit in one process: one line per case,
        # <nonce>{json}, with candidate prints captured and a per-case CPU limit.
        import io as _iv_io, time as _iv_time, signal as _iv_signal, traceback as _iv_tb

        class _IvTimeout(BaseException):
            pass

        _iv_armed = [False]

        def _iv_on_timeout(signum, frame):
            if _iv_armed[0]:
                raise _IvTimeout()

        _iv_signal.signal(_iv_signal.SIGPROF, _iv_on_timeout)
        _iv_nonce = str(_iv_val["nonce"])
        _iv_cases = _iv_val["cases"]
        _iv_limit = _iv_val["caseTimeoutMs"] / 1000.0
        _iv_out = _iv_sys.stdout

        def _iv_emit(i, status, output, printed, error, ms):
            _iv_out.write(_iv_nonce + _iv_json.dumps({"i": i, "s": status, "o": output, "p": printed, "e": error, "ms": ms}) + "\\n")
            _iv_out.flush()

        for _iv_i, _iv_case in enumerate(_iv_cases):
            _iv_buf = _iv_io.StringIO()
            _iv_status, _iv_res, _iv_err = "ok", None, ""
            _iv_start = _iv_time.perf_counter()
            _iv_sys.stdout = _iv_buf
            try:
                _iv_signal.setitimer(_iv_signal.ITIMER_PROF, _iv_limit)
                _iv_armed[0] = True
                _iv_res = _iv_call(_iv_get_fn(), _iv_case)
                _iv_armed[0] = False
                _iv_res = _iv_fmt(_iv_res)
            except _IvTimeout:
                _iv_status = "tle"
            except MemoryError:
                _iv_status = "mle"
            except BaseException:
                _iv_status = "error"
                _iv_err = _iv_tb.format_exc(limit=-5)
            finally:
                _iv_armed[0] = False
                _iv_signal.setitimer(_iv_signal.ITIMER_PROF, 0)
                _iv_sys.stdout = _iv_out
            _iv_printed = _iv_buf.getvalue()
            _iv_ms = int((_iv_time.perf_counter() - _iv_start) * 1000)
            _iv_emit(_iv_i, _iv_status, _iv_res if _iv_res is not None else _iv_printed, _iv_printed, _iv_err, _iv_ms)
            if _iv_status == "tle":
                for _iv_j in range(_iv_i + 1, len(_iv_cases)):
                    _iv_emit(_iv_j, "skipped", "", "", "", 0)
                break
    else:
        _iv_res = _iv_fmt(_iv_call(_iv_get_fn(), _iv_val))
        if _iv_res is not None:
            print(_iv_res)
`;
  }

  // ─── Java ───────────────────────────────────────────────────────────────────

  private prepareJava(code: string): PreparedProgram {
    const hasOwnMain = /static\s+void\s+main\s*\(/.test(code);
    if (hasOwnMain) {
      // Candidate wrote a full program: Judge0 compiles Main.java, so the
      // public class must be named Main.
      const sourceCode = code.replace(
        /public\s+class\s+([A-Za-z0-9_]+)/g,
        (match, className) => (className !== "Main" ? "public class Main" : match),
      );
      return { sourceCode, stdinMode: "legacy" };
    }

    let source = code.replace(/^\s*package\s+[\w.]+\s*;\s*$/gm, "");

    // The driver must own the name Main.
    if (/\bclass\s+Main\b/.test(source)) {
      source = source.replace(/\bMain\b/g, "CandidateMain");
    }

    // Only one public top-level type is allowed per file, and it must be Main.
    source = source.replace(
      /\bpublic\s+((?:final\s+|abstract\s+)*)(class|interface|enum)\s+/g,
      "$1$2 ",
    );

    const classNames = Array.from(source.matchAll(/\bclass\s+([A-Za-z_]\w*)/g)).map((m) => m[1]);
    const targetClass = classNames.includes("Solution") ? "Solution" : classNames[0] || "Solution";

    const methodMatch = source.match(
      /\bpublic\s+(?:static\s+)?(?:final\s+)?(?:synchronized\s+)?(?:<[^>]+>\s+)?[\w.]+(?:<[^()]*?>)?(?:\[\])*\s+([A-Za-z_]\w*)\s*\(/,
    );
    const preferredMethod = methodMatch?.[1] && methodMatch[1] !== "main" ? methodMatch[1] : "";

    const driver = this.compactJava(this.javaDriver(targetClass, preferredMethod));
    const sourceCode = `import java.util.*;\n${source}\n${driver}`;
    return { sourceCode, stdinMode: "json" };
  }

  // The driver is sent (and stored by Judge0) with every test case, so drop
  // indentation, blank lines and comment lines. Safe for Java: no text blocks
  // or line-sensitive syntax in the driver.
  private compactJava(source: string): string {
    return source
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("//"))
      .join("\n");
  }

  private javaDriver(targetClass: string, preferredMethod: string): string {
    return `
@SuppressWarnings({"unchecked", "rawtypes"})
public class Main {
    private static final String IV_TARGET_CLASS = "${targetClass}";
    private static final String IV_PREFERRED_METHOD = "${preferredMethod}";

    public static void main(String[] args) throws Throwable {
        java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) sb.append(line).append('\\n');
        String raw = sb.toString().trim();
        Object input;
        try {
            input = raw.isEmpty() ? null : IvJson.parse(raw);
        } catch (RuntimeException e) {
            input = raw;
        }

        if (input instanceof Map && Boolean.TRUE.equals(((Map) input).get("__iv_multi__"))) {
            ivRunMulti((Map<String, Object>) input);
            return;
        }

        String output = ivInvoke(Class.forName(IV_TARGET_CLASS), input);
        if (output != null) System.out.println(output);
        System.out.flush();
    }

    // Calls the candidate's method once; returns the formatted result, or null
    // for void methods and null results.
    static String ivInvoke(Class<?> cls, Object input) throws Throwable {
        java.lang.reflect.Method method = ivPickMethod(cls, input);
        method.setAccessible(true);
        Object target = null;
        if (!java.lang.reflect.Modifier.isStatic(method.getModifiers())) {
            java.lang.reflect.Constructor<?> ctor = cls.getDeclaredConstructor();
            ctor.setAccessible(true);
            target = ctor.newInstance();
        }
        Object[] callArgs = ivArgs(input, method);
        Object result;
        try {
            result = method.invoke(target, callArgs);
        } catch (java.lang.reflect.InvocationTargetException e) {
            throw e.getCause();
        }
        if (method.getReturnType() == void.class || result == null) return null;
        return ivFormat(result, true);
    }

    // Runs every test case of a Run/Submit in one JVM, so the code compiles
    // once. Each case reports one line: <nonce>{json}. Candidate prints are
    // captured per case, and each case gets its own CPU-time limit.
    static void ivRunMulti(Map<String, Object> spec) throws Exception {
        final String nonce = String.valueOf(spec.get("nonce"));
        final List<Object> cases = (List<Object>) spec.get("cases");
        final long caseCpuNanos = ((Number) spec.get("caseTimeoutMs")).longValue() * 1000000L;
        final java.io.PrintStream realOut = System.out;
        final Class<?> cls = Class.forName(IV_TARGET_CLASS);
        final java.lang.management.ThreadMXBean mx = java.lang.management.ManagementFactory.getThreadMXBean();
        for (int i = 0; i < cases.size(); i++) {
            final Object input = cases.get(i);
            final String[] result = new String[1];
            final Throwable[] failure = new Throwable[1];
            java.io.ByteArrayOutputStream printed = new java.io.ByteArrayOutputStream();
            Thread worker = new Thread(() -> {
                try {
                    result[0] = ivInvoke(cls, input);
                } catch (Throwable t) {
                    failure[0] = t;
                }
            });
            worker.setDaemon(true);
            System.setOut(new java.io.PrintStream(printed, true, "UTF-8"));
            long start = System.nanoTime();
            worker.start();
            boolean timedOut = false;
            while (worker.isAlive()) {
                worker.join(20);
                long cpu = mx.isThreadCpuTimeSupported() ? mx.getThreadCpuTime(worker.getId()) : System.nanoTime() - start;
                if (worker.isAlive() && cpu > caseCpuNanos) {
                    timedOut = true;
                    break;
                }
            }
            System.out.flush();
            System.setOut(realOut);
            long ms = (System.nanoTime() - start) / 1000000L;
            String printedText = printed.toString("UTF-8");
            String status = "ok";
            String error = "";
            if (timedOut) {
                status = "tle";
            } else if (failure[0] != null) {
                status = failure[0] instanceof OutOfMemoryError ? "mle" : "error";
                error = ivDescribe(failure[0]);
            }
            ivEmit(realOut, nonce, i, status, result[0] != null ? result[0] : printedText, printedText, error, ms);
            if (timedOut) {
                // The runaway thread cannot be stopped; skip the rest and end the JVM.
                for (int j = i + 1; j < cases.size(); j++) ivEmit(realOut, nonce, j, "skipped", "", "", "", 0);
                Runtime.getRuntime().halt(0);
            }
        }
        realOut.flush();
        // halt, not exit: ends any threads the candidate left running.
        Runtime.getRuntime().halt(0);
    }

    static void ivEmit(java.io.PrintStream out, String nonce, int i, String status, String output, String printed, String error, long ms) {
        out.println(nonce + "{\\"i\\":" + i + ",\\"s\\":" + ivQuote(status) + ",\\"o\\":" + ivQuote(output)
            + ",\\"p\\":" + ivQuote(printed) + ",\\"e\\":" + ivQuote(error) + ",\\"ms\\":" + ms + "}");
        out.flush();
    }

    // Exception plus the first frames from candidate code (not the driver/JDK).
    static String ivDescribe(Throwable t) {
        StringBuilder b = new StringBuilder(t.toString());
        int shown = 0;
        for (StackTraceElement e : t.getStackTrace()) {
            String c = e.getClassName();
            if (c.equals("Main") || c.startsWith("Main$") || c.startsWith("java.") || c.startsWith("jdk.") || c.startsWith("sun.")) continue;
            b.append("\\n\\tat ").append(e);
            if (++shown == 5) break;
        }
        return b.toString();
    }

    static java.lang.reflect.Method ivPickMethod(Class<?> cls, Object input) {
        List<java.lang.reflect.Method> candidates = new ArrayList<>();
        for (java.lang.reflect.Method m : cls.getDeclaredMethods()) {
            if (m.isSynthetic() || m.isBridge() || m.getName().equals("main")) continue;
            if (java.lang.reflect.Modifier.isPrivate(m.getModifiers())) continue;
            candidates.add(m);
        }
        if (candidates.isEmpty()) {
            throw new IllegalStateException("No callable method found in class " + cls.getName());
        }
        List<java.lang.reflect.Method> named = new ArrayList<>();
        for (java.lang.reflect.Method m : candidates) {
            if (m.getName().equals(IV_PREFERRED_METHOD)) named.add(m);
        }
        if (!named.isEmpty()) candidates = named;
        for (java.lang.reflect.Method m : candidates) {
            if (ivFits(input, m.getParameterCount())) return m;
        }
        for (java.lang.reflect.Method m : candidates) {
            if (java.lang.reflect.Modifier.isPublic(m.getModifiers())) return m;
        }
        return candidates.get(0);
    }

    static boolean ivFits(Object input, int n) {
        if (input == null) return n == 0;
        if (n == 1) return true;
        if (input instanceof Map) return ((Map) input).size() == n;
        if (input instanceof List) return ((List) input).size() == n;
        return false;
    }

    static Object[] ivArgs(Object input, java.lang.reflect.Method m) {
        Class<?>[] types = m.getParameterTypes();
        java.lang.reflect.Type[] generic = m.getGenericParameterTypes();
        int n = types.length;
        Object[] out = new Object[n];
        if (n == 0) return out;
        List<Object> values;
        if (input instanceof Map && ((Map) input).size() == n && !(n == 1 && Map.class.isAssignableFrom(types[0]))) {
            values = new ArrayList<>(((Map<String, Object>) input).values());
        } else if (input instanceof List && n > 1 && ((List) input).size() == n) {
            values = (List<Object>) input;
        } else if (n == 1) {
            values = Collections.singletonList(input);
        } else {
            throw new IllegalArgumentException("Test input does not match the " + n + " parameter(s) of " + m.getName());
        }
        for (int i = 0; i < n; i++) out[i] = ivConvert(values.get(i), types[i], generic[i]);
        return out;
    }

    static Object ivConvert(Object v, Class<?> t, java.lang.reflect.Type g) throws RuntimeException {
        if (t == Object.class) return ivGuess(v);
        if (v == null) return t.isPrimitive() ? ivDefault(t) : null;
        if (t == int.class || t == Integer.class) return Integer.valueOf((int) ivLong(v));
        if (t == long.class || t == Long.class) return Long.valueOf(ivLong(v));
        if (t == double.class || t == Double.class) return Double.valueOf(ivDouble(v));
        if (t == float.class || t == Float.class) return Float.valueOf((float) ivDouble(v));
        if (t == short.class || t == Short.class) return Short.valueOf((short) ivLong(v));
        if (t == byte.class || t == Byte.class) return Byte.valueOf((byte) ivLong(v));
        if (t == boolean.class || t == Boolean.class) {
            return v instanceof Boolean ? v : Boolean.valueOf(String.valueOf(v).trim());
        }
        if (t == char.class || t == Character.class) {
            String s = String.valueOf(v);
            return s.isEmpty() ? Character.valueOf('\\0') : Character.valueOf(s.charAt(0));
        }
        if (t == String.class) return v instanceof String ? v : ivFormat(v, true);
        if (t == char[].class && v instanceof String) return ((String) v).toCharArray();
        if (t.isArray()) {
            Class<?> ct = t.getComponentType();
            List<?> items = ivAsList(v);
            Object arr = java.lang.reflect.Array.newInstance(ct, items.size());
            for (int i = 0; i < items.size(); i++) {
                java.lang.reflect.Array.set(arr, i, ivConvert(items.get(i), ct, ct));
            }
            return arr;
        }
        if (Collection.class.isAssignableFrom(t)) {
            java.lang.reflect.Type et = ivTypeArg(g, 0);
            Collection<Object> c;
            if (t.isAssignableFrom(ArrayList.class)) c = new ArrayList<>();
            else if (t.isAssignableFrom(LinkedHashSet.class)) c = new LinkedHashSet<>();
            else if (t.isAssignableFrom(LinkedList.class)) c = new LinkedList<>();
            else if (t.isAssignableFrom(TreeSet.class)) c = new TreeSet<>();
            else c = (Collection<Object>) ivInstantiate(t);
            for (Object item : ivAsList(v)) c.add(ivConvert(item, ivRaw(et), et));
            return c;
        }
        if (Map.class.isAssignableFrom(t) && v instanceof Map) {
            java.lang.reflect.Type kt = ivTypeArg(g, 0);
            java.lang.reflect.Type vt = ivTypeArg(g, 1);
            Map<Object, Object> m;
            if (t.isAssignableFrom(LinkedHashMap.class)) m = new LinkedHashMap<>();
            else if (t.isAssignableFrom(TreeMap.class)) m = new TreeMap<>();
            else m = (Map<Object, Object>) ivInstantiate(t);
            for (Map.Entry<String, Object> e : ((Map<String, Object>) v).entrySet()) {
                m.put(ivConvert(e.getKey(), ivRaw(kt), kt), ivConvert(e.getValue(), ivRaw(vt), vt));
            }
            return m;
        }
        return v;
    }

    static Object ivInstantiate(Class<?> t) {
        try {
            return t.getDeclaredConstructor().newInstance();
        } catch (Exception e) {
            throw new IllegalArgumentException("Cannot create parameter of type " + t.getName());
        }
    }

    // Best guess for parameters declared as Object (older starter code).
    static Object ivGuess(Object v) {
        if (v instanceof Long) {
            long l = (Long) v;
            return (l >= Integer.MIN_VALUE && l <= Integer.MAX_VALUE) ? (Object) Integer.valueOf((int) l) : v;
        }
        if (v instanceof List) {
            List<?> l = (List<?>) v;
            if (l.isEmpty()) return new int[0];
            boolean allInt = true, allLong = true, allNum = true, allStr = true, allBool = true;
            for (Object o : l) {
                if (o instanceof Long) {
                    long x = (Long) o;
                    if (x < Integer.MIN_VALUE || x > Integer.MAX_VALUE) allInt = false;
                } else {
                    allInt = false;
                    allLong = false;
                }
                if (!(o instanceof Number)) allNum = false;
                if (!(o instanceof String)) allStr = false;
                if (!(o instanceof Boolean)) allBool = false;
            }
            if (allInt) return ivConvert(l, int[].class, int[].class);
            if (allLong) return ivConvert(l, long[].class, long[].class);
            if (allNum) return ivConvert(l, double[].class, double[].class);
            if (allStr) return ivConvert(l, String[].class, String[].class);
            if (allBool) return ivConvert(l, boolean[].class, boolean[].class);
        }
        return v;
    }

    static Object ivDefault(Class<?> t) {
        if (t == boolean.class) return Boolean.FALSE;
        if (t == char.class) return Character.valueOf('\\0');
        if (t == double.class) return Double.valueOf(0);
        if (t == float.class) return Float.valueOf(0);
        if (t == long.class) return Long.valueOf(0);
        if (t == short.class) return Short.valueOf((short) 0);
        if (t == byte.class) return Byte.valueOf((byte) 0);
        return Integer.valueOf(0);
    }

    static long ivLong(Object v) {
        if (v instanceof Number) return ((Number) v).longValue();
        if (v instanceof Boolean) return ((Boolean) v) ? 1 : 0;
        return Long.parseLong(String.valueOf(v).trim());
    }

    static double ivDouble(Object v) {
        if (v instanceof Number) return ((Number) v).doubleValue();
        if (v instanceof Boolean) return ((Boolean) v) ? 1 : 0;
        return Double.parseDouble(String.valueOf(v).trim());
    }

    static List<?> ivAsList(Object v) {
        if (v == null) return Collections.emptyList();
        if (v instanceof List) return (List<?>) v;
        return Collections.singletonList(v);
    }

    static Class<?> ivRaw(java.lang.reflect.Type t) {
        if (t instanceof Class) return (Class<?>) t;
        if (t instanceof java.lang.reflect.ParameterizedType) {
            return (Class<?>) ((java.lang.reflect.ParameterizedType) t).getRawType();
        }
        if (t instanceof java.lang.reflect.GenericArrayType) {
            Class<?> ct = ivRaw(((java.lang.reflect.GenericArrayType) t).getGenericComponentType());
            return java.lang.reflect.Array.newInstance(ct, 0).getClass();
        }
        if (t instanceof java.lang.reflect.WildcardType) {
            return ivRaw(((java.lang.reflect.WildcardType) t).getUpperBounds()[0]);
        }
        return Object.class;
    }

    static java.lang.reflect.Type ivTypeArg(java.lang.reflect.Type g, int i) {
        if (g instanceof java.lang.reflect.ParameterizedType) {
            java.lang.reflect.Type[] args = ((java.lang.reflect.ParameterizedType) g).getActualTypeArguments();
            if (i < args.length) return args[i];
        }
        return Object.class;
    }

    // Top-level strings/chars print raw; everything nested prints as JSON.
    static String ivFormat(Object v, boolean top) {
        if (v == null) return "null";
        if (v instanceof Boolean) return v.toString();
        if (v instanceof String) return top ? (String) v : ivQuote((String) v);
        if (v instanceof Character) return top ? v.toString() : ivQuote(v.toString());
        if (v instanceof Double || v instanceof Float) return ivNumber(((Number) v).doubleValue());
        if (v instanceof Number) return v.toString();
        StringBuilder b = new StringBuilder();
        if (v.getClass().isArray()) {
            int len = java.lang.reflect.Array.getLength(v);
            b.append('[');
            for (int i = 0; i < len; i++) {
                if (i > 0) b.append(',');
                b.append(ivFormat(java.lang.reflect.Array.get(v, i), false));
            }
            return b.append(']').toString();
        }
        if (v instanceof Collection) {
            b.append('[');
            boolean first = true;
            for (Object o : (Collection<?>) v) {
                if (!first) b.append(',');
                first = false;
                b.append(ivFormat(o, false));
            }
            return b.append(']').toString();
        }
        if (v instanceof Map) {
            b.append('{');
            boolean first = true;
            for (Map.Entry<?, ?> e : ((Map<?, ?>) v).entrySet()) {
                if (!first) b.append(',');
                first = false;
                b.append(ivQuote(String.valueOf(e.getKey()))).append(':').append(ivFormat(e.getValue(), false));
            }
            return b.append('}').toString();
        }
        return top ? v.toString() : ivQuote(v.toString());
    }

    static String ivNumber(double d) {
        if (Double.isNaN(d) || Double.isInfinite(d)) return String.valueOf(d);
        if (d == Math.rint(d) && Math.abs(d) < 1e15) return String.valueOf((long) d);
        return java.math.BigDecimal.valueOf(d).stripTrailingZeros().toPlainString();
    }

    static String ivQuote(String s) {
        StringBuilder b = new StringBuilder("\\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': b.append("\\\\\\""); break;
                case '\\\\': b.append("\\\\\\\\"); break;
                case '\\n': b.append("\\\\n"); break;
                case '\\r': b.append("\\\\r"); break;
                case '\\t': b.append("\\\\t"); break;
                default:
                    if (c < 0x20) b.append(String.format("\\\\u%04x", (int) c));
                    else b.append(c);
            }
        }
        return b.append('"').toString();
    }

    static final class IvJson {
        private final String s;
        private int i;

        private IvJson(String s) { this.s = s; }

        static Object parse(String s) {
            IvJson p = new IvJson(s);
            Object v = p.value();
            p.ws();
            if (p.i != s.length()) throw new IllegalArgumentException("Unexpected trailing input");
            return v;
        }

        private void ws() {
            while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++;
        }

        private Object value() {
            ws();
            if (i >= s.length()) throw new IllegalArgumentException("Unexpected end of input");
            char c = s.charAt(i);
            if (c == '{') return obj();
            if (c == '[') return arr();
            if (c == '"') return str();
            if (s.startsWith("true", i)) { i += 4; return Boolean.TRUE; }
            if (s.startsWith("false", i)) { i += 5; return Boolean.FALSE; }
            if (s.startsWith("null", i)) { i += 4; return null; }
            return num();
        }

        private Map<String, Object> obj() {
            Map<String, Object> m = new LinkedHashMap<>();
            i++;
            ws();
            if (i < s.length() && s.charAt(i) == '}') { i++; return m; }
            while (true) {
                ws();
                String k = str();
                ws();
                expect(':');
                m.put(k, value());
                ws();
                char c = s.charAt(i++);
                if (c == '}') return m;
                if (c != ',') throw new IllegalArgumentException("Expected ',' or '}'");
            }
        }

        private List<Object> arr() {
            List<Object> l = new ArrayList<>();
            i++;
            ws();
            if (i < s.length() && s.charAt(i) == ']') { i++; return l; }
            while (true) {
                l.add(value());
                ws();
                char c = s.charAt(i++);
                if (c == ']') return l;
                if (c != ',') throw new IllegalArgumentException("Expected ',' or ']'");
            }
        }

        private String str() {
            expect('"');
            StringBuilder b = new StringBuilder();
            while (true) {
                char c = s.charAt(i++);
                if (c == '"') return b.toString();
                if (c != '\\\\') { b.append(c); continue; }
                char e = s.charAt(i++);
                switch (e) {
                    case 'n': b.append('\\n'); break;
                    case 't': b.append('\\t'); break;
                    case 'r': b.append('\\r'); break;
                    case 'b': b.append('\\b'); break;
                    case 'f': b.append('\\f'); break;
                    case 'u': b.append((char) Integer.parseInt(s.substring(i, i + 4), 16)); i += 4; break;
                    default: b.append(e);
                }
            }
        }

        private Object num() {
            int start = i;
            while (i < s.length() && "+-0123456789.eE".indexOf(s.charAt(i)) >= 0) i++;
            String t = s.substring(start, i);
            if (t.isEmpty()) throw new IllegalArgumentException("Unexpected character at " + start);
            if (t.indexOf('.') < 0 && t.indexOf('e') < 0 && t.indexOf('E') < 0) {
                try {
                    return Long.valueOf(t);
                } catch (NumberFormatException ignored) {
                    // falls through to Double for out-of-range integers
                }
            }
            return Double.valueOf(t);
        }

        private void expect(char c) {
            if (i >= s.length() || s.charAt(i) != c) throw new IllegalArgumentException("Expected '" + c + "'");
            i++;
        }
    }
}
`;
  }

  // ─── Legacy stdin (programs that read stdin themselves) ─────────────────────

  private formatLegacyStdin(input: any): string {
    if (input === null || input === undefined) return "";
    if (typeof input === "string") {
      const trimmed = input.trim();
      if (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        try {
          const parsed = JSON.parse(trimmed);
          return this.convertObjectToStdin(parsed);
        } catch {
          return trimmed;
        }
      }
      return trimmed;
    }
    if (typeof input === "number" || typeof input === "boolean") return String(input);
    if (typeof input === "object") {
      return this.convertObjectToStdin(input);
    }
    return String(input).trim();
  }

  private convertObjectToStdin(input: any): string {
    if (input === null || input === undefined) return "";
    if (typeof input === "string") return input.trim();
    if (typeof input === "number" || typeof input === "boolean") return String(input);

    if (Array.isArray(input)) {
      if (input.length === 0) return "0";
      // Array of objects (e.g. operations [{ op: "ADD", val: 5 }])
      if (typeof input[0] === "object" && input[0] !== null) {
        const lines: string[] = [String(input.length)];
        for (const item of input) {
          lines.push(Object.values(item).join(" "));
        }
        return lines.join("\n");
      }
      // Array of primitives (e.g. [1, 2, 3]) -> space-separated
      return input.join(" ");
    }

    if (typeof input === "object") {
      if (typeof input.stdin === "string") {
        return input.stdin.trim();
      }

      const lines: string[] = [];
      for (const key of Object.keys(input)) {
        const val = input[key];
        if (val === null || val === undefined) continue;

        if (Array.isArray(val)) {
          if (val.length === 0) {
            lines.push("0");
          } else if (typeof val[0] === "object" && val[0] !== null) {
            lines.push(String(val.length));
            for (const item of val) {
              lines.push(Object.values(item).join(" "));
            }
          } else {
            lines.push(val.join(" "));
          }
        } else if (typeof val === "object") {
          lines.push(Object.values(val).join(" "));
        } else {
          lines.push(String(val));
        }
      }
      return lines.join("\n");
    }

    return String(input).trim();
  }
}
