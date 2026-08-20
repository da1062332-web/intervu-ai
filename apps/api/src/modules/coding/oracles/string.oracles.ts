import { Injectable } from "@nestjs/common";
import { BaseOracle } from "./base.oracle";

/**
 * 6. STRING_PALINDROME_ORACLE
 */
@Injectable()
export class StringPalindromeOracle extends BaseOracle {
  readonly key = "STRING_PALINDROME_ORACLE";
  readonly name = "String Palindrome";
  readonly category = "STRING";
  readonly description = "Determines whether a string reads identically forward and backward.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    str: {
      type: "string",
      options: ["racecar", "level", "radar", "deified", "civic", "rotor", "hello", "world", "algorithm"],
      default: "racecar",
    },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const str = typeof parameters.str === "string" ? parameters.str : "racecar";
    return { str };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const str = typeof input.str === "string" ? input.str : "";
    const reversed = str.split("").reverse().join("");
    const isPalindrome = str === reversed;

    return {
      isPalindrome,
      result: isPalindrome,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.str !== "string") {
      errors.push("Input property 'str' must be a string.");
    }
    return errors;
  }
}

/**
 * 7. STRING_REVERSE_ORACLE
 */
@Injectable()
export class StringReverseOracle extends BaseOracle {
  readonly key = "STRING_REVERSE_ORACLE";
  readonly name = "String Reverse";
  readonly category = "STRING";
  readonly description = "Reverses the characters of a string.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    str: {
      type: "string",
      options: ["hello world", "algorithm", "data structures", "interview", "antigravity"],
      default: "hello world",
    },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const str = typeof parameters.str === "string" ? parameters.str : "hello world";
    return { str };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const str = typeof input.str === "string" ? input.str : "";
    const reversedStr = str.split("").reverse().join("");

    return {
      reversedStr,
      result: reversedStr,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.str !== "string") {
      errors.push("Input property 'str' must be a string.");
    }
    return errors;
  }
}

/**
 * 8. STRING_CASE_CONVERSION_ORACLE
 */
@Injectable()
export class StringCaseConversionOracle extends BaseOracle {
  readonly key = "STRING_CASE_CONVERSION_ORACLE";
  readonly name = "String Case Conversion";
  readonly category = "STRING";
  readonly description = "Converts a string between uppercase and lowercase.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    str: { type: "string", default: "Hello World 123!" },
    mode: { type: "enum", options: ["UPPERCASE", "LOWERCASE"], default: "UPPERCASE" },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const str = typeof parameters.str === "string" ? parameters.str : "Hello World 123!";
    const mode = parameters.mode === "LOWERCASE" ? "LOWERCASE" : "UPPERCASE";
    return { str, mode };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const str = typeof input.str === "string" ? input.str : "";
    const mode = input.mode === "LOWERCASE" ? "LOWERCASE" : "UPPERCASE";
    const convertedStr = mode === "UPPERCASE" ? str.toUpperCase() : str.toLowerCase();

    return {
      convertedStr,
      result: convertedStr,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.str !== "string") {
      errors.push("Input property 'str' must be a string.");
    }
    if (input.mode !== "UPPERCASE" && input.mode !== "LOWERCASE") {
      errors.push("Input property 'mode' must be 'UPPERCASE' or 'LOWERCASE'.");
    }
    return errors;
  }
}

/**
 * 9. STRING_VOWEL_COUNT_ORACLE
 */
@Injectable()
export class StringVowelCountOracle extends BaseOracle {
  readonly key = "STRING_VOWEL_COUNT_ORACLE";
  readonly name = "String Vowel Count";
  readonly category = "STRING";
  readonly description = "Counts vowels occurring in a string.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    str: { type: "string", default: "TCS National Qualifier Test" },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const str = typeof parameters.str === "string" ? parameters.str : "TCS National Qualifier Test";
    return { str };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const str = typeof input.str === "string" ? input.str : "";
    const vowels = new Set(["a", "e", "i", "o", "u", "A", "E", "I", "O", "U"]);
    let count = 0;
    for (const ch of str) {
      if (vowels.has(ch)) count++;
    }

    return {
      count,
      result: count,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.str !== "string") {
      errors.push("Input property 'str' must be a string.");
    }
    return errors;
  }
}

/**
 * 10. STRING_CHARACTER_COUNT_ORACLE
 */
@Injectable()
export class StringCharacterCountOracle extends BaseOracle {
  readonly key = "STRING_CHARACTER_COUNT_ORACLE";
  readonly name = "String Character Count";
  readonly category = "STRING";
  readonly description = "Counts occurrences of a specified character.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    str: { type: "string", default: "programming in typescript" },
    targetChar: { type: "string", default: "p" },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const str = typeof parameters.str === "string" ? parameters.str : "programming in typescript";
    const targetChar = typeof parameters.targetChar === "string" && parameters.targetChar.length > 0
      ? parameters.targetChar[0]
      : "p";
    return { str, targetChar };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const str = typeof input.str === "string" ? input.str : "";
    const targetChar = typeof input.targetChar === "string" && input.targetChar.length > 0 ? input.targetChar[0] : "";

    let count = 0;
    if (targetChar) {
      for (const ch of str) {
        if (ch === targetChar) count++;
      }
    }

    return {
      count,
      result: count,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.str !== "string") {
      errors.push("Input property 'str' must be a string.");
    }
    if (typeof input.targetChar !== "string" || input.targetChar.length !== 1) {
      errors.push("Input property 'targetChar' must be a single character.");
    }
    return errors;
  }
}

/**
 * 11. STRING_FREQUENCY_ORACLE
 */
@Injectable()
export class StringFrequencyOracle extends BaseOracle {
  readonly key = "STRING_FREQUENCY_ORACLE";
  readonly name = "String Character Frequency";
  readonly category = "STRING";
  readonly description = "Calculates the frequency of every character in a string.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    str: { type: "string", default: "engineering" },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const str = typeof parameters.str === "string" ? parameters.str : "engineering";
    return { str };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const str = typeof input.str === "string" ? input.str : "";
    const frequencies: Record<string, number> = {};
    for (const ch of str) {
      frequencies[ch] = (frequencies[ch] || 0) + 1;
    }

    return {
      frequencies,
      result: frequencies,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.str !== "string") {
      errors.push("Input property 'str' must be a string.");
    }
    return errors;
  }
}

/**
 * 12. STRING_SUBSTRING_COUNT_ORACLE
 */
@Injectable()
export class StringSubstringCountOracle extends BaseOracle {
  readonly key = "STRING_SUBSTRING_COUNT_ORACLE";
  readonly name = "Substring Count";
  readonly category = "STRING";
  readonly description = "Counts occurrences of a substring inside a string (including overlapping).";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    str: { type: "string", default: "banana" },
    sub: { type: "string", default: "an" },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const str = typeof parameters.str === "string" ? parameters.str : "banana";
    const sub = typeof parameters.sub === "string" ? parameters.sub : "an";
    return { str, sub };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const str = typeof input.str === "string" ? input.str : "";
    const sub = typeof input.sub === "string" ? input.sub : "";

    let count = 0;
    if (str.length > 0 && sub.length > 0) {
      let pos = 0;
      while ((pos = str.indexOf(sub, pos)) !== -1) {
        count++;
        pos += 1; // overlapping matches allowed
      }
    }

    return {
      count,
      result: count,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.str !== "string") errors.push("Input property 'str' must be a string.");
    if (typeof input.sub !== "string" || input.sub.length === 0) {
      errors.push("Input property 'sub' must be a non-empty string.");
    }
    return errors;
  }
}

/**
 * 13. STRING_ANAGRAM_ORACLE
 */
@Injectable()
export class StringAnagramOracle extends BaseOracle {
  readonly key = "STRING_ANAGRAM_ORACLE";
  readonly name = "String Anagram";
  readonly category = "STRING";
  readonly description = "Determines whether two strings contain the same character composition.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    str1: { type: "string", default: "listen" },
    str2: { type: "string", default: "silent" },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const str1 = typeof parameters.str1 === "string" ? parameters.str1 : "listen";
    const str2 = typeof parameters.str2 === "string" ? parameters.str2 : "silent";
    return { str1, str2 };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const s1 = typeof input.str1 === "string" ? input.str1 : "";
    const s2 = typeof input.str2 === "string" ? input.str2 : "";

    const normalize = (s: string) => s.split("").sort().join("");
    const isAnagram = s1.length === s2.length && normalize(s1) === normalize(s2);

    return {
      isAnagram,
      result: isAnagram,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.str1 !== "string") errors.push("Input property 'str1' must be a string.");
    if (typeof input.str2 !== "string") errors.push("Input property 'str2' must be a string.");
    return errors;
  }
}

/**
 * 14. STRING_WORD_COUNT_ORACLE
 */
@Injectable()
export class StringWordCountOracle extends BaseOracle {
  readonly key = "STRING_WORD_COUNT_ORACLE";
  readonly name = "Word Count";
  readonly category = "STRING";
  readonly description = "Counts words in a sentence.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    sentence: { type: "string", default: "The quick brown fox jumps over the lazy dog" },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const sentence = typeof parameters.sentence === "string" ? parameters.sentence : "The quick brown fox jumps over the lazy dog";
    return { sentence };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const sentence = typeof input.sentence === "string" ? input.sentence.trim() : "";
    const words = sentence.length > 0 ? sentence.split(/\s+/).filter(Boolean) : [];

    return {
      wordCount: words.length,
      result: words.length,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.sentence !== "string") {
      errors.push("Input property 'sentence' must be a string.");
    }
    return errors;
  }
}

/**
 * 15. STRING_LARGEST_WORD_ORACLE
 */
@Injectable()
export class StringLargestWordOracle extends BaseOracle {
  readonly key = "STRING_LARGEST_WORD_ORACLE";
  readonly name = "Largest Word in Sentence";
  readonly category = "STRING";
  readonly description = "Finds the longest word in a sentence.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    sentence: { type: "string", default: "Artificial intelligence empowers modern technology" },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const sentence = typeof parameters.sentence === "string" ? parameters.sentence : "Artificial intelligence empowers modern technology";
    return { sentence };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const sentence = typeof input.sentence === "string" ? input.sentence.trim() : "";
    const words = sentence.length > 0 ? sentence.split(/\s+/).filter(Boolean) : [];

    let largestWord = "";
    for (const w of words) {
      if (w.length > largestWord.length) {
        largestWord = w;
      }
    }

    return {
      largestWord,
      length: largestWord.length,
      result: largestWord,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.sentence !== "string") {
      errors.push("Input property 'sentence' must be a string.");
    }
    return errors;
  }
}

/**
 * 16. STRING_REMOVE_SPACES_ORACLE
 */
@Injectable()
export class StringRemoveSpacesOracle extends BaseOracle {
  readonly key = "STRING_REMOVE_SPACES_ORACLE";
  readonly name = "Remove Spaces";
  readonly category = "STRING";
  readonly description = "Removes spaces from a string.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    str: { type: "string", default: "T C S   A d v a n c e d" },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const str = typeof parameters.str === "string" ? parameters.str : "T C S   A d v a n c e d";
    return { str };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const str = typeof input.str === "string" ? input.str : "";
    const resultStr = str.replace(/\s+/g, "");

    return {
      resultStr,
      result: resultStr,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.str !== "string") {
      errors.push("Input property 'str' must be a string.");
    }
    return errors;
  }
}

/**
 * 17. STRING_FIRST_NON_REPEATING_ORACLE
 */
@Injectable()
export class StringFirstNonRepeatingOracle extends BaseOracle {
  readonly key = "STRING_FIRST_NON_REPEATING_ORACLE";
  readonly name = "First Non-Repeating Character";
  readonly category = "STRING";
  readonly description = "Finds the first character that occurs exactly once.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    str: { type: "string", default: "swiss" },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const str = typeof parameters.str === "string" ? parameters.str : "swiss";
    return { str };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const str = typeof input.str === "string" ? input.str : "";
    const counts: Record<string, number> = {};

    for (const ch of str) {
      counts[ch] = (counts[ch] || 0) + 1;
    }

    let firstChar = "";
    for (const ch of str) {
      if (counts[ch] === 1) {
        firstChar = ch;
        break;
      }
    }

    return {
      char: firstChar,
      result: firstChar,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.str !== "string") {
      errors.push("Input property 'str' must be a string.");
    }
    return errors;
  }
}

/**
 * 18. STRING_REMOVE_DUPLICATES_ORACLE
 */
@Injectable()
export class StringRemoveDuplicatesOracle extends BaseOracle {
  readonly key = "STRING_REMOVE_DUPLICATES_ORACLE";
  readonly name = "Remove Duplicate Characters";
  readonly category = "STRING";
  readonly description = "Removes repeated characters while preserving first occurrence order.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    str: { type: "string", default: "banana" },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const str = typeof parameters.str === "string" ? parameters.str : "banana";
    return { str };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const str = typeof input.str === "string" ? input.str : "";
    const seen = new Set<string>();
    let resultStr = "";

    for (const ch of str) {
      if (!seen.has(ch)) {
        seen.add(ch);
        resultStr += ch;
      }
    }

    return {
      resultStr,
      result: resultStr,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.str !== "string") {
      errors.push("Input property 'str' must be a string.");
    }
    return errors;
  }
}

/**
 * 19. STRING_WORD_FREQUENCY_ORACLE
 */
@Injectable()
export class StringWordFrequencyOracle extends BaseOracle {
  readonly key = "STRING_WORD_FREQUENCY_ORACLE";
  readonly name = "Word Frequency Map";
  readonly category = "STRING";
  readonly description = "Calculates frequency of each word in a sentence.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    sentence: { type: "string", default: "To be or not to be that is the question" },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const sentence = typeof parameters.sentence === "string" ? parameters.sentence : "To be or not to be that is the question";
    return { sentence };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const sentence = typeof input.sentence === "string" ? input.sentence.trim() : "";
    const words = sentence.length > 0 ? sentence.split(/\s+/).filter(Boolean) : [];
    const frequencies: Record<string, number> = {};

    for (const word of words) {
      const lower = word.toLowerCase();
      frequencies[lower] = (frequencies[lower] || 0) + 1;
    }

    return {
      frequencies,
      result: frequencies,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.sentence !== "string") {
      errors.push("Input property 'sentence' must be a string.");
    }
    return errors;
  }
}
