import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ─────────────────────────────────────────────────────────────
// EASY (12) — tagged to IT Services recruiters
// TCS, Infosys, Wipro, Accenture, Cognizant, Deloitte, Capgemini, IBM
// ─────────────────────────────────────────────────────────────
const EASY_QUESTIONS = [
  {
    id: 'reverse-string',
    title: 'Reverse a String',
    topic: 'Strings',
    difficulty: 'Easy',
    companiesAsked: ['TCS', 'Infosys', 'Wipro', 'Capgemini', 'Accenture'],
    expectedTimeMinutes: 8,
    optimalComplexity: 'O(n) time, O(n) space',
    description: 'Write a function that reverses a string. The input is given as an array of characters. Modify the array in-place.',
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]', explanation: 'Reverse each character in place.' },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]', explanation: 'Same approach for any string.' }
    ],
    testCases: [
      { input: 's = ["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', hidden: false },
      { input: 's = ["A","B","C"]', expectedOutput: '["C","B","A"]', hidden: true }
    ],
    companyNotes: {
      TCS: `NQT expects you to write this using both loop and built-in. Know both.`,
      Capgemini: `Pseudo-code tracing may be asked — trace output for a given input string step by step.`
    },
    starterCode: {
      javascript: `function reverseString(s) {\n  let left = 0, right = s.length - 1;\n  while (left < right) {\n    [s[left], s[right]] = [s[right], s[left]];\n    left++; right--;\n  }\n  return s;\n}`,
      python: `def reverse_string(s):\n    left, right = 0, len(s) - 1\n    while left < right:\n        s[left], s[right] = s[right], s[left]\n        left += 1; right -= 1\n    return s`,
      cpp: `void reverseString(vector<char>& s) {\n    int l = 0, r = s.size()-1;\n    while(l < r) { swap(s[l++], s[r--]); }\n}`,
      java: `public void reverseString(char[] s) {\n    int l = 0, r = s.length-1;\n    while(l < r) { char t = s[l]; s[l++] = s[r]; s[r--] = t; }\n}`
    }
  },
  {
    id: 'check-palindrome',
    title: 'Check Palindrome String',
    topic: 'Strings',
    difficulty: 'Easy',
    companiesAsked: ['Infosys', 'Wipro', 'Cognizant', 'IBM', 'Deloitte'],
    expectedTimeMinutes: 8,
    optimalComplexity: 'O(n) time, O(1) space',
    description: 'Given a string `s`, return `true` if it reads the same backward as forward, and `false` otherwise. Ignore case and non-alphanumeric characters.',
    examples: [
      { input: 's = "A man a plan a canal Panama"', output: 'true', explanation: 'Removing spaces and ignoring case: "amanaplanacanalpanama".' },
      { input: 's = "race a car"', output: 'false', explanation: 'Not a palindrome.' }
    ],
    testCases: [
      { input: 's = "racecar"', expectedOutput: 'true', hidden: false },
      { input: 's = "hello"', expectedOutput: 'false', hidden: true }
    ],
    companyNotes: {
      Infosys: `InfyTQ commonly includes palindrome as part of the logical reasoning coding section.`,
      IBM: `May ask follow-up: handle Unicode characters or check if any permutation of the string is a palindrome.`
    },
    starterCode: {
      javascript: `function isPalindrome(s) {\n  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return cleaned === cleaned.split('').reverse().join('');\n}`,
      python: `def is_palindrome(s):\n    cleaned = ''.join(c.lower() for c in s if c.isalnum())\n    return cleaned == cleaned[::-1]`,
      cpp: `bool isPalindrome(string s) {\n    string t;\n    for(char c : s) if(isalnum(c)) t += tolower(c);\n    return t == string(t.rbegin(), t.rend());\n}`,
      java: `public boolean isPalindrome(String s) {\n    String t = s.toLowerCase().replaceAll("[^a-z0-9]","");\n    return t.equals(new StringBuilder(t).reverse().toString());\n}`
    }
  },
  {
    id: 'find-max-in-array',
    title: 'Find Maximum in Array',
    topic: 'Arrays',
    difficulty: 'Easy',
    companiesAsked: ['TCS', 'Wipro', 'Accenture', 'Capgemini', 'Cognizant', 'Deloitte'],
    expectedTimeMinutes: 5,
    optimalComplexity: 'O(n) time, O(1) space',
    description: 'Given an integer array `nums`, find the maximum element and return it. Do not use built-in sort or max functions.',
    examples: [
      { input: 'nums = [3, 1, 4, 1, 5, 9, 2, 6]', output: '9', explanation: 'Scan through all elements tracking the largest seen.' }
    ],
    testCases: [
      { input: 'nums = [3, 1, 4, 1, 5, 9, 2, 6]', expectedOutput: '9', hidden: false },
      { input: 'nums = [-5, -1, -3]', expectedOutput: '-1', hidden: true }
    ],
    companyNotes: {
      TCS: `NQT often tests basic array traversal with a twist — they may ask for both max and its index position.`,
      Deloitte: `Aptitude section includes output tracing for simple loop-based problems like this.`
    },
    starterCode: {
      javascript: `function findMax(nums) {\n  let max = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    if (nums[i] > max) max = nums[i];\n  }\n  return max;\n}`,
      python: `def find_max(nums):\n    max_val = nums[0]\n    for n in nums[1:]:\n        if n > max_val:\n            max_val = n\n    return max_val`,
      cpp: `int findMax(vector<int>& nums) {\n    int mx = nums[0];\n    for(int n : nums) mx = max(mx, n);\n    return mx;\n}`,
      java: `public int findMax(int[] nums) {\n    int mx = nums[0];\n    for(int n : nums) mx = Math.max(mx, n);\n    return mx;\n}`
    }
  },
  {
    id: 'count-vowels',
    title: 'Count Vowels in String',
    topic: 'Strings',
    difficulty: 'Easy',
    companiesAsked: ['Capgemini', 'Accenture', 'Wipro', 'TCS'],
    expectedTimeMinutes: 5,
    optimalComplexity: 'O(n) time, O(1) space',
    description: 'Given a string `s`, count the number of vowels (a, e, i, o, u — both uppercase and lowercase) in it.',
    examples: [
      { input: 's = "Hello World"', output: '3', explanation: 'Vowels are: e, o, o' }
    ],
    testCases: [
      { input: 's = "Hello World"', expectedOutput: '3', hidden: false },
      { input: 's = "aeiouAEIOU"', expectedOutput: '10', hidden: true }
    ],
    companyNotes: {
      Capgemini: `Pseudo-code round asks you to trace vowel count output without running code — practice mental execution.`
    },
    starterCode: {
      javascript: `function countVowels(s) {\n  const vowels = new Set('aeiouAEIOU');\n  return [...s].filter(c => vowels.has(c)).length;\n}`,
      python: `def count_vowels(s):\n    return sum(1 for c in s if c.lower() in 'aeiou')`,
      cpp: `int countVowels(string s) {\n    int cnt = 0;\n    string v = "aeiouAEIOU";\n    for(char c : s) if(v.find(c) != string::npos) cnt++;\n    return cnt;\n}`,
      java: `public int countVowels(String s) {\n    int cnt = 0;\n    for(char c : s.toCharArray()) if("aeiouAEIOU".indexOf(c) >= 0) cnt++;\n    return cnt;\n}`
    }
  },
  {
    id: 'fibonacci-nth',
    title: 'Nth Fibonacci Number',
    topic: 'Arrays',
    difficulty: 'Easy',
    companiesAsked: ['Infosys', 'Cognizant', 'IBM', 'Wipro', 'Capgemini'],
    expectedTimeMinutes: 8,
    optimalComplexity: 'O(n) time, O(1) space (iterative)',
    description: 'Return the nth Fibonacci number where F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2).',
    examples: [
      { input: 'n = 6', output: '8', explanation: '0,1,1,2,3,5,8 — F(6) = 8.' }
    ],
    testCases: [
      { input: 'n = 6', expectedOutput: '8', hidden: false },
      { input: 'n = 10', expectedOutput: '55', hidden: true }
    ],
    companyNotes: {
      Infosys: `InfyTQ may ask both recursive and iterative versions. Be ready to explain the trade-offs.`,
      IBM: `May ask: what is the time complexity of the naive recursive solution and how do you optimize it?`
    },
    starterCode: {
      javascript: `function fib(n) {\n  if (n <= 1) return n;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) {\n    [a, b] = [b, a + b];\n  }\n  return b;\n}`,
      python: `def fib(n):\n    if n <= 1: return n\n    a, b = 0, 1\n    for _ in range(2, n+1):\n        a, b = b, a + b\n    return b`,
      cpp: `int fib(int n) {\n    if(n<=1) return n;\n    int a=0, b=1;\n    for(int i=2;i<=n;i++) { int t=a+b; a=b; b=t; }\n    return b;\n}`,
      java: `public int fib(int n) {\n    if(n<=1) return n;\n    int a=0, b=1;\n    for(int i=2;i<=n;i++) { int t=a+b; a=b; b=t; }\n    return b;\n}`
    }
  },
  {
    id: 'check-armstrong',
    title: 'Check Armstrong Number',
    topic: 'Arrays',
    difficulty: 'Easy',
    companiesAsked: ['TCS', 'Accenture', 'Deloitte', 'Capgemini'],
    expectedTimeMinutes: 8,
    optimalComplexity: 'O(d) time where d = number of digits, O(1) space',
    description: 'An Armstrong number is a number that equals the sum of its own digits each raised to the power of the number of digits. Given n, return true if it is an Armstrong number.',
    examples: [
      { input: 'n = 153', output: 'true', explanation: '1^3 + 5^3 + 3^3 = 1 + 125 + 27 = 153' },
      { input: 'n = 9474', output: 'true', explanation: '9^4+4^4+7^4+4^4 = 9474' }
    ],
    testCases: [
      { input: 'n = 153', expectedOutput: 'true', hidden: false },
      { input: 'n = 100', expectedOutput: 'false', hidden: true }
    ],
    companyNotes: {
      TCS: `NQT includes such number theory problems with loop and math. Know digit extraction: n % 10.`
    },
    starterCode: {
      javascript: `function isArmstrong(n) {\n  const s = String(n), pow = s.length;\n  return n === s.split('').reduce((sum, d) => sum + Math.pow(+d, pow), 0);\n}`,
      python: `def is_armstrong(n):\n    d = len(str(n))\n    return n == sum(int(c)**d for c in str(n))`,
      cpp: `bool isArmstrong(int n) {\n    string s = to_string(n); int p = s.size(), sum=0;\n    for(char c:s) sum += pow(c-'0', p);\n    return sum == n;\n}`,
      java: `public boolean isArmstrong(int n) {\n    String s = Integer.toString(n); int p=s.length(), sum=0;\n    for(char c:s.toCharArray()) sum += (int)Math.pow(c-'0',p);\n    return sum==n;\n}`
    }
  },
  {
    id: 'find-duplicate-in-array',
    title: 'Find the Duplicate Element',
    topic: 'Arrays',
    difficulty: 'Easy',
    companiesAsked: ['Cognizant', 'IBM', 'Wipro', 'Infosys', 'TCS'],
    expectedTimeMinutes: 10,
    optimalComplexity: 'O(n) time, O(n) space (HashMap approach)',
    description: 'Given an array of integers where every element appears exactly twice except for one — find and return the element that appears only once.',
    examples: [
      { input: 'nums = [4,1,2,1,2]', output: '4', explanation: 'XOR all elements: duplicates cancel out, unique remains.' }
    ],
    testCases: [
      { input: 'nums = [4,1,2,1,2]', expectedOutput: '4', hidden: false },
      { input: 'nums = [2,2,3,3,5]', expectedOutput: '5', hidden: true }
    ],
    companyNotes: {
      Cognizant: `GenC tests include this pattern — know both the HashMap O(n) and the XOR O(1) space approach.`,
      IBM: `Interviewer may ask which approach uses less memory — push you toward XOR bit manipulation.`
    },
    starterCode: {
      javascript: `function singleNumber(nums) {\n  return nums.reduce((xor, n) => xor ^ n, 0);\n}`,
      python: `from functools import reduce\ndef single_number(nums):\n    return reduce(lambda a,b: a^b, nums)`,
      cpp: `int singleNumber(vector<int>& nums) {\n    int res = 0;\n    for(int n : nums) res ^= n;\n    return res;\n}`,
      java: `public int singleNumber(int[] nums) {\n    int res = 0;\n    for(int n : nums) res ^= n;\n    return res;\n}`
    }
  },
  {
    id: 'linear-search',
    title: 'Linear Search & First Occurrence',
    topic: 'Arrays',
    difficulty: 'Easy',
    companiesAsked: ['Deloitte', 'Capgemini', 'Wipro', 'Accenture'],
    expectedTimeMinutes: 5,
    optimalComplexity: 'O(n) time, O(1) space',
    description: 'Given a sorted integer array `nums` and a target value, return the index of the first occurrence of target. Return -1 if not found.',
    examples: [
      { input: 'nums = [1,2,2,3,4,5], target = 2', output: '1', explanation: 'First occurrence of 2 is at index 1.' }
    ],
    testCases: [
      { input: 'nums = [1,2,2,3,4,5], target = 2', expectedOutput: '1', hidden: false },
      { input: 'nums = [1,2,3], target = 7', expectedOutput: '-1', hidden: true }
    ],
    companyNotes: {
      Deloitte: `Case study presentations may involve algorithm selection trade-offs: linear vs binary search.`
    },
    starterCode: {
      javascript: `function firstOccurrence(nums, target) {\n  for (let i = 0; i < nums.length; i++) {\n    if (nums[i] === target) return i;\n  }\n  return -1;\n}`,
      python: `def first_occurrence(nums, target):\n    for i, n in enumerate(nums):\n        if n == target: return i\n    return -1`,
      cpp: `int firstOccurrence(vector<int>& nums, int target) {\n    for(int i=0;i<nums.size();i++) if(nums[i]==target) return i;\n    return -1;\n}`,
      java: `public int firstOccurrence(int[] nums, int target) {\n    for(int i=0;i<nums.length;i++) if(nums[i]==target) return i;\n    return -1;\n}`
    }
  },
  {
    id: 'check-anagram',
    title: 'Check if Two Strings are Anagrams',
    topic: 'Strings',
    difficulty: 'Easy',
    companiesAsked: ['Infosys', 'IBM', 'Cognizant', 'Wipro'],
    expectedTimeMinutes: 8,
    optimalComplexity: 'O(n) time, O(1) space (26 char frequency)',
    description: 'Given two strings `s` and `t`, return true if `t` is an anagram of `s`, and false otherwise.',
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true', explanation: 'Same characters with same frequencies.' },
      { input: 's = "rat", t = "car"', output: 'false', explanation: 'Different character frequencies.' }
    ],
    testCases: [
      { input: 's = "anagram", t = "nagaram"', expectedOutput: 'true', hidden: false },
      { input: 's = "rat", t = "car"', expectedOutput: 'false', hidden: true }
    ],
    companyNotes: {
      IBM: `Technical interview may ask: could you do this without sorting? Push toward frequency array O(n).`
    },
    starterCode: {
      javascript: `function isAnagram(s, t) {\n  if (s.length !== t.length) return false;\n  const freq = {};\n  for (let c of s) freq[c] = (freq[c] || 0) + 1;\n  for (let c of t) {\n    if (!freq[c]) return false;\n    freq[c]--;\n  }\n  return true;\n}`,
      python: `def is_anagram(s, t):\n    from collections import Counter\n    return Counter(s) == Counter(t)`,
      cpp: `bool isAnagram(string s, string t) {\n    if(s.size()!=t.size()) return false;\n    vector<int> f(26,0);\n    for(char c:s) f[c-'a']++;\n    for(char c:t) if(--f[c-'a']<0) return false;\n    return true;\n}`,
      java: `public boolean isAnagram(String s, String t) {\n    if(s.length()!=t.length()) return false;\n    int[] f = new int[26];\n    for(char c:s.toCharArray()) f[c-'a']++;\n    for(char c:t.toCharArray()) if(--f[c-'a']<0) return false;\n    return true;\n}`
    }
  },
  {
    id: 'sum-of-digits',
    title: 'Sum of Digits of a Number',
    topic: 'Arrays',
    difficulty: 'Easy',
    companiesAsked: ['TCS', 'Capgemini', 'Accenture', 'Deloitte'],
    expectedTimeMinutes: 5,
    optimalComplexity: 'O(d) time where d = number of digits',
    description: 'Given a non-negative integer n, compute and return the sum of all its digits.',
    examples: [
      { input: 'n = 12345', output: '15', explanation: '1+2+3+4+5 = 15.' }
    ],
    testCases: [
      { input: 'n = 12345', expectedOutput: '15', hidden: false },
      { input: 'n = 999', expectedOutput: '27', hidden: true }
    ],
    companyNotes: {
      TCS: `NQT aptitude commonly includes digit-sum and digit-manipulation questions as warm-ups.`,
      Capgemini: `Pseudo-code tracing section may ask you to predict output of a digit-sum loop.`
    },
    starterCode: {
      javascript: `function sumDigits(n) {\n  return String(n).split('').reduce((sum, d) => sum + +d, 0);\n}`,
      python: `def sum_digits(n):\n    return sum(int(d) for d in str(n))`,
      cpp: `int sumDigits(int n) {\n    int s=0;\n    while(n>0) { s+=n%10; n/=10; }\n    return s;\n}`,
      java: `public int sumDigits(int n) {\n    int s=0;\n    while(n>0) { s+=n%10; n/=10; }\n    return s;\n}`
    }
  },
  {
    id: 'binary-search-sorted',
    title: 'Binary Search in Sorted Array',
    topic: 'Arrays',
    difficulty: 'Easy',
    companiesAsked: ['TCS', 'Infosys', 'Cognizant', 'IBM', 'Wipro', 'Accenture'],
    expectedTimeMinutes: 10,
    optimalComplexity: 'O(log n) time, O(1) space',
    description: 'Given an array of integers `nums` sorted in ascending order, and an integer `target`, write a function to search target in nums. If target exists, return its index. Otherwise, return -1.',
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 exists at index 4.' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 does not exist.' }
    ],
    testCases: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', expectedOutput: '4', hidden: false },
      { input: 'nums = [1,2,3,4,5], target = 6', expectedOutput: '-1', hidden: true }
    ],
    companyNotes: {
      TCS: `NQT includes searching and sorting logic. Know the loop condition: while (left <= right).`,
      Infosys: `InfyTQ may ask to implement both iterative and recursive binary search.`
    },
    starterCode: {
      javascript: `function search(nums, target) {\n  let left = 0, right = nums.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (nums[mid] === target) return mid;\n    else if (nums[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}`,
      python: `def search(nums, target):\n    l, r = 0, len(nums)-1\n    while l <= r:\n        m = (l+r)//2\n        if nums[m] == target: return m\n        elif nums[m] < target: l = m+1\n        else: r = m-1\n    return -1`,
      cpp: `int search(vector<int>& nums, int target) {\n    int l=0, r=nums.size()-1;\n    while(l<=r) { int m=(l+r)/2; if(nums[m]==target) return m; else if(nums[m]<target) l=m+1; else r=m-1; }\n    return -1;\n}`,
      java: `public int search(int[] nums, int target) {\n    int l=0, r=nums.length-1;\n    while(l<=r) { int m=(l+r)/2; if(nums[m]==target) return m; else if(nums[m]<target) l=m+1; else r=m-1; }\n    return -1;\n}`
    }
  },
  {
    id: 'char-frequency-map',
    title: 'Character Frequency Counter',
    topic: 'Strings',
    difficulty: 'Easy',
    companiesAsked: ['Wipro', 'Cognizant', 'Capgemini', 'Accenture', 'Deloitte'],
    expectedTimeMinutes: 8,
    optimalComplexity: 'O(n) time, O(k) space where k = unique characters',
    description: 'Given a string `s`, return a frequency map of each character sorted alphabetically as a formatted string "char:count" pairs joined by ", ".',
    examples: [
      { input: 's = "banana"', output: '"a:3, b:1, n:2"', explanation: 'Count each character and sort alphabetically.' }
    ],
    testCases: [
      { input: 's = "banana"', expectedOutput: '"a:3, b:1, n:2"', hidden: false },
      { input: 's = "aabb"', expectedOutput: '"a:2, b:2"', hidden: true }
    ],
    companyNotes: {
      Cognizant: `GenC tests ask frequency-based questions. Know Map/Dictionary data structure syntax in your preferred language.`
    },
    starterCode: {
      javascript: `function charFrequency(s) {\n  const freq = {};\n  for (let c of s) freq[c] = (freq[c] || 0) + 1;\n  return Object.keys(freq).sort().map(k => \`\${k}:\${freq[k]}\`).join(', ');\n}`,
      python: `def char_frequency(s):\n    from collections import Counter\n    freq = Counter(s)\n    return ', '.join(f'{k}:{v}' for k,v in sorted(freq.items()))`,
      cpp: `string charFrequency(string s) {\n    map<char,int> freq;\n    for(char c:s) freq[c]++;\n    string res;\n    for(auto& p:freq) { if(!res.empty()) res+=", "; res+=p.first+string(":")+to_string(p.second); }\n    return res;\n}`,
      java: `public String charFrequency(String s) {\n    Map<Character,Integer> freq = new TreeMap<>();\n    for(char c:s.toCharArray()) freq.merge(c,1,Integer::sum);\n    StringBuilder sb = new StringBuilder();\n    freq.forEach((k,v)->{ if(sb.length()>0) sb.append(", "); sb.append(k+":"+v); });\n    return sb.toString();\n}`
    }
  }
];

// ─────────────────────────────────────────────────────────────
// MEDIUM (16) — tagged to mid-tier & product companies
// Microsoft, Apple, Adobe, JP Morgan, Flipkart, Swiggy, Amazon
// ─────────────────────────────────────────────────────────────
const MEDIUM_QUESTIONS = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Medium',
    companiesAsked: ['Amazon', 'Microsoft', 'Adobe', 'Flipkart', 'JP Morgan'],
    expectedTimeMinutes: 12,
    optimalComplexity: 'O(n) time, O(n) space',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target. Each input has exactly one solution. You may not use the same element twice.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9.' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'nums[1] + nums[2] == 6.' }
    ],
    testCases: [
      { input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0,1]', hidden: false },
      { input: 'nums = [3,3], target = 6', expectedOutput: '[0,1]', hidden: true }
    ],
    companyNotes: {
      Amazon: `Expect a follow-up: "What if the array is sorted — can you do it in O(1) space with two pointers?"`,
      Microsoft: `Interviewer may ask you to handle duplicates or return all valid pairs.`,
      Adobe: `Clean HashMap implementation is valued here — comment on why O(n²) brute force is avoided.`
    },
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
      python: `def two_sum(nums, target):\n    prev = {}\n    for i, n in enumerate(nums):\n        diff = target - n\n        if diff in prev: return [prev[diff], i]\n        prev[n] = i\n    return []`,
      cpp: `vector<int> twoSum(vector<int>& nums, int target) {\n    unordered_map<int,int> mp;\n    for(int i=0;i<nums.size();i++) {\n        int d=target-nums[i];\n        if(mp.count(d)) return {mp[d],i};\n        mp[nums[i]]=i;\n    }\n    return {};\n}`,
      java: `public int[] twoSum(int[] nums, int target) {\n    Map<Integer,Integer> map = new HashMap<>();\n    for(int i=0;i<nums.length;i++) {\n        int d=target-nums[i];\n        if(map.containsKey(d)) return new int[]{map.get(d),i};\n        map.put(nums[i],i);\n    }\n    return new int[]{};\n}`
    }
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    topic: 'Strings',
    difficulty: 'Medium',
    companiesAsked: ['Amazon', 'Microsoft', 'Adobe', 'Flipkart', 'JP Morgan'],
    expectedTimeMinutes: 12,
    optimalComplexity: 'O(n) time, O(n) space',
    description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid. Open brackets must be closed by the same type and in the correct order.',
    examples: [
      { input: 's = "()[]{}"', output: 'true', explanation: 'All matched.' },
      { input: 's = "(]"', output: 'false', explanation: 'Mismatch.' }
    ],
    testCases: [
      { input: 's = "()[]{}"', expectedOutput: 'true', hidden: false },
      { input: 's = "([)]"', expectedOutput: 'false', hidden: true }
    ],
    companyNotes: {
      Amazon: `Follow-up: "What if we add new bracket types? How does your solution scale?"`,
      Microsoft: `Expect clean stack usage. Brute force nested loops is not acceptable.`
    },
    starterCode: {
      javascript: `function isValid(s) {\n  const stack = [];\n  const pairs = { ')': '(', '}': '{', ']': '[' };\n  for (let c of s) {\n    if (c in pairs) { if (stack.pop() !== pairs[c]) return false; }\n    else stack.push(c);\n  }\n  return stack.length === 0;\n}`,
      python: `def is_valid(s):\n    stack = []\n    pairs = {')':'(', '}':'{', ']':'['}\n    for c in s:\n        if c in pairs:\n            if not stack or stack.pop() != pairs[c]: return False\n        else: stack.append(c)\n    return len(stack) == 0`,
      cpp: `bool isValid(string s) {\n    stack<char> st;\n    for(char c:s) {\n        if(c=='('||c=='{'||c=='[') st.push(c);\n        else { if(st.empty()) return false; char t=st.top(); st.pop(); if((c==')'&&t!='(')||(c=='}'&&t!='{')||(c==']'&&t!='[')) return false; }\n    }\n    return st.empty();\n}`,
      java: `public boolean isValid(String s) {\n    Deque<Character> stack = new ArrayDeque<>();\n    for(char c:s.toCharArray()) {\n        if(c=='('||c=='{'||c=='[') stack.push(c);\n        else { if(stack.isEmpty()) return false; char t=stack.pop(); if((c==')'&&t!='(')||(c=='}'&&t!='{')||(c==']'&&t!='[')) return false; }\n    }\n    return stack.isEmpty();\n}`
    }
  },
  {
    id: 'longest-substring-no-repeat',
    title: 'Longest Substring Without Repeating Characters',
    topic: 'Sliding Window',
    difficulty: 'Medium',
    companiesAsked: ['Amazon', 'Microsoft', 'Flipkart', 'Swiggy', 'Apple'],
    expectedTimeMinutes: 15,
    optimalComplexity: 'O(n) time, O(min(m,n)) space',
    description: 'Given a string `s`, find the length of the longest substring without repeating characters.',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: '"abc" has length 3.' },
      { input: 's = "pwwkew"', output: '3', explanation: '"wke" has length 3.' }
    ],
    testCases: [
      { input: 's = "abcabcbb"', expectedOutput: '3', hidden: false },
      { input: 's = "bbbbb"', expectedOutput: '1', hidden: true }
    ],
    companyNotes: {
      Amazon: `Relate this to a real caching scenario: "What if these were user session tokens needing uniqueness?"`,
      Flipkart: `Machine coding extension: return the actual substring, not just the length.`,
      Apple: `Expected clean sliding window with O(n) — any O(n²) approach will be flagged.`
    },
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {\n  const set = new Set();\n  let left = 0, max = 0;\n  for (let right = 0; right < s.length; right++) {\n    while (set.has(s[right])) { set.delete(s[left++]); }\n    set.add(s[right]);\n    max = Math.max(max, right - left + 1);\n  }\n  return max;\n}`,
      python: `def length_of_longest_substring(s):\n    seen = {}\n    l = 0; mx = 0\n    for r, c in enumerate(s):\n        if c in seen and seen[c] >= l: l = seen[c] + 1\n        seen[c] = r\n        mx = max(mx, r - l + 1)\n    return mx`,
      cpp: `int lengthOfLongestSubstring(string s) {\n    unordered_map<char,int> mp; int l=0,mx=0;\n    for(int r=0;r<s.size();r++) {\n        if(mp.count(s[r])&&mp[s[r]]>=l) l=mp[s[r]]+1;\n        mp[s[r]]=r; mx=max(mx,r-l+1);\n    }\n    return mx;\n}`,
      java: `public int lengthOfLongestSubstring(String s) {\n    Map<Character,Integer> mp = new HashMap<>();\n    int l=0,mx=0;\n    for(int r=0;r<s.length();r++) {\n        if(mp.containsKey(s.charAt(r))&&mp.get(s.charAt(r))>=l) l=mp.get(s.charAt(r))+1;\n        mp.put(s.charAt(r),r); mx=Math.max(mx,r-l+1);\n    }\n    return mx;\n}`
    }
  },
  {
    id: 'merge-intervals',
    title: 'Merge Intervals',
    topic: 'Arrays',
    difficulty: 'Medium',
    companiesAsked: ['Amazon', 'Microsoft', 'Flipkart', 'Adobe'],
    expectedTimeMinutes: 18,
    optimalComplexity: 'O(n log n) time, O(n) space',
    description: 'Given an array of intervals where `intervals[i] = [start, end]`, merge all overlapping intervals and return an array of non-overlapping intervals.',
    examples: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: '[1,3] and [2,6] overlap → merged to [1,6].' }
    ],
    testCases: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]', hidden: false },
      { input: 'intervals = [[1,4],[4,5]]', expectedOutput: '[[1,5]]', hidden: true }
    ],
    companyNotes: {
      Amazon: `Real-world framing: "How would you use this for merging calendar meeting slots?"`,
      Microsoft: `Ask yourself: what happens when you have fully contained intervals like [[1,10],[2,5]]?`,
      Flipkart: `Machine coding round extension: detect conflicts in time-slot booking systems.`
    },
    starterCode: {
      javascript: `function merge(intervals) {\n  intervals.sort((a, b) => a[0] - b[0]);\n  const res = [intervals[0]];\n  for (let i = 1; i < intervals.length; i++) {\n    const last = res[res.length - 1];\n    if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]);\n    else res.push(intervals[i]);\n  }\n  return res;\n}`,
      python: `def merge(intervals):\n    intervals.sort(key=lambda x: x[0])\n    merged = [intervals[0]]\n    for s, e in intervals[1:]:\n        if s <= merged[-1][1]: merged[-1][1] = max(merged[-1][1], e)\n        else: merged.append([s, e])\n    return merged`,
      cpp: `vector<vector<int>> merge(vector<vector<int>>& intervals) {\n    sort(intervals.begin(),intervals.end());\n    vector<vector<int>> res = {intervals[0]};\n    for(auto& i:intervals) {\n        if(i[0]<=res.back()[1]) res.back()[1]=max(res.back()[1],i[1]);\n        else res.push_back(i);\n    }\n    return res;\n}`,
      java: `public int[][] merge(int[][] intervals) {\n    Arrays.sort(intervals,(a,b)->a[0]-b[0]);\n    List<int[]> res = new ArrayList<>();\n    res.add(intervals[0]);\n    for(int[] i:intervals) {\n        int[] last=res.get(res.size()-1);\n        if(i[0]<=last[1]) last[1]=Math.max(last[1],i[1]);\n        else res.add(i);\n    }\n    return res.toArray(new int[0][]);\n}`
    }
  },
  {
    id: 'product-except-self',
    title: 'Product of Array Except Self',
    topic: 'Arrays',
    difficulty: 'Medium',
    companiesAsked: ['Amazon', 'Apple', 'Microsoft', 'Adobe'],
    expectedTimeMinutes: 18,
    optimalComplexity: 'O(n) time, O(1) extra space (output array excluded)',
    description: 'Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all elements of `nums` except `nums[i]`. Must run in O(n) without division.',
    examples: [
      { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]', explanation: 'prefix × suffix product at each position.' }
    ],
    testCases: [
      { input: 'nums = [1,2,3,4]', expectedOutput: '[24,12,8,6]', hidden: false },
      { input: 'nums = [-1,1,0,-3,3]', expectedOutput: '[0,0,9,0,0]', hidden: true }
    ],
    companyNotes: {
      Amazon: `Expect follow-up: "What if the constraints said O(1) space? Could you still do it without a prefix array?"`,
      Apple: `Clean prefix/suffix pass is expected. Division approach is not allowed.`
    },
    starterCode: {
      javascript: `function productExceptSelf(nums) {\n  const n = nums.length, out = new Array(n).fill(1);\n  let prefix = 1;\n  for (let i = 0; i < n; i++) { out[i] = prefix; prefix *= nums[i]; }\n  let suffix = 1;\n  for (let i = n-1; i >= 0; i--) { out[i] *= suffix; suffix *= nums[i]; }\n  return out;\n}`,
      python: `def product_except_self(nums):\n    n = len(nums)\n    out = [1]*n\n    prefix = 1\n    for i in range(n): out[i] = prefix; prefix *= nums[i]\n    suffix = 1\n    for i in range(n-1,-1,-1): out[i] *= suffix; suffix *= nums[i]\n    return out`,
      cpp: `vector<int> productExceptSelf(vector<int>& nums) {\n    int n=nums.size(); vector<int> out(n,1);\n    int p=1; for(int i=0;i<n;i++){out[i]=p;p*=nums[i];}\n    int s=1; for(int i=n-1;i>=0;i--){out[i]*=s;s*=nums[i];}\n    return out;\n}`,
      java: `public int[] productExceptSelf(int[] nums) {\n    int n=nums.length; int[] out=new int[n];\n    int p=1; for(int i=0;i<n;i++){out[i]=p;p*=nums[i];}\n    int s=1; for(int i=n-1;i>=0;i--){out[i]*=s;s*=nums[i];}\n    return out;\n}`
    }
  },
  {
    id: 'level-order-traversal',
    title: 'Binary Tree Level Order Traversal',
    topic: 'Trees',
    difficulty: 'Medium',
    companiesAsked: ['Amazon', 'Microsoft', 'JP Morgan', 'Adobe'],
    expectedTimeMinutes: 18,
    optimalComplexity: 'O(n) time, O(n) space',
    description: 'Given the root of a binary tree, return the level order traversal of its nodes values (left to right, level by level).',
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]', explanation: 'BFS queue per level.' }
    ],
    testCases: [
      { input: 'root = [3,9,20,null,null,15,7]', expectedOutput: '[[3],[9,20],[15,7]]', hidden: false },
      { input: 'root = [1]', expectedOutput: '[[1]]', hidden: true }
    ],
    companyNotes: {
      Amazon: `"How would you modify this to return right side view of the tree only?"`,
      Microsoft: `Clean BFS with queue is expected. Recursive DFS with level tracking also acceptable.`
    },
    starterCode: {
      javascript: `function levelOrder(root) {\n  if (!root) return [];\n  const res = [], q = [root];\n  while (q.length) {\n    const lvl = [];\n    for (let i = q.length; i > 0; i--) {\n      const n = q.shift();\n      lvl.push(n.val);\n      if (n.left) q.push(n.left);\n      if (n.right) q.push(n.right);\n    }\n    res.push(lvl);\n  }\n  return res;\n}`,
      python: `from collections import deque\ndef level_order(root):\n    if not root: return []\n    res, q = [], deque([root])\n    while q:\n        lvl = []\n        for _ in range(len(q)):\n            n = q.popleft(); lvl.append(n.val)\n            if n.left: q.append(n.left)\n            if n.right: q.append(n.right)\n        res.append(lvl)\n    return res`,
      cpp: `vector<vector<int>> levelOrder(TreeNode* root) {\n    if(!root) return {};\n    vector<vector<int>> res; queue<TreeNode*> q; q.push(root);\n    while(!q.empty()) {\n        int sz=q.size(); vector<int> lvl;\n        for(int i=0;i<sz;i++){auto n=q.front();q.pop();lvl.push_back(n->val);if(n->left)q.push(n->left);if(n->right)q.push(n->right);}\n        res.push_back(lvl);\n    }\n    return res;\n}`,
      java: `public List<List<Integer>> levelOrder(TreeNode root) {\n    List<List<Integer>> res=new ArrayList<>(); if(root==null) return res;\n    Queue<TreeNode> q=new LinkedList<>(); q.offer(root);\n    while(!q.isEmpty()) { int sz=q.size(); List<Integer> lvl=new ArrayList<>();\n        for(int i=0;i<sz;i++){TreeNode n=q.poll();lvl.add(n.val);if(n.left!=null)q.offer(n.left);if(n.right!=null)q.offer(n.right);}\n        res.add(lvl); }\n    return res;\n}`
    }
  },
  {
    id: 'coin-change',
    title: 'Coin Change (Minimum Coins)',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    companiesAsked: ['Amazon', 'Microsoft', 'JP Morgan', 'Flipkart'],
    expectedTimeMinutes: 20,
    optimalComplexity: 'O(n × amount) time, O(amount) space',
    description: 'Given coin denominations and a target amount, return the minimum number of coins needed to reach the amount. Return -1 if impossible.',
    examples: [
      { input: 'coins = [1,2,5], amount = 11', output: '3', explanation: '5+5+1 = 3 coins.' }
    ],
    testCases: [
      { input: 'coins = [1,2,5], amount = 11', expectedOutput: '3', hidden: false },
      { input: 'coins = [2], amount = 3', expectedOutput: '-1', hidden: true }
    ],
    companyNotes: {
      Amazon: `"What if each coin can only be used once? How does the DP table change — 0/1 Knapsack vs unbounded?"`,
      'JP Morgan': `Financial systems framing: minimum transaction denominations — same pattern as currency change problems.`
    },
    starterCode: {
      javascript: `function coinChange(coins, amount) {\n  const dp = new Array(amount+1).fill(Infinity);\n  dp[0] = 0;\n  for (let i = 1; i <= amount; i++)\n    for (let c of coins)\n      if (i-c >= 0) dp[i] = Math.min(dp[i], dp[i-c]+1);\n  return dp[amount] === Infinity ? -1 : dp[amount];\n}`,
      python: `def coin_change(coins, amount):\n    dp = [float('inf')]*(amount+1)\n    dp[0] = 0\n    for i in range(1,amount+1):\n        for c in coins:\n            if i-c >= 0: dp[i] = min(dp[i], dp[i-c]+1)\n    return dp[amount] if dp[amount] != float('inf') else -1`,
      cpp: `int coinChange(vector<int>& coins, int amount) {\n    vector<int> dp(amount+1, INT_MAX);\n    dp[0]=0;\n    for(int i=1;i<=amount;i++) for(int c:coins) if(i-c>=0&&dp[i-c]!=INT_MAX) dp[i]=min(dp[i],dp[i-c]+1);\n    return dp[amount]==INT_MAX?-1:dp[amount];\n}`,
      java: `public int coinChange(int[] coins, int amount) {\n    int[] dp = new int[amount+1];\n    Arrays.fill(dp, amount+1);\n    dp[0]=0;\n    for(int i=1;i<=amount;i++) for(int c:coins) if(i-c>=0) dp[i]=Math.min(dp[i],dp[i-c]+1);\n    return dp[amount]>amount?-1:dp[amount];\n}`
    }
  },
  {
    id: 'group-anagrams',
    title: 'Group Anagrams',
    topic: 'Arrays',
    difficulty: 'Medium',
    companiesAsked: ['Amazon', 'Apple', 'Microsoft', 'Swiggy'],
    expectedTimeMinutes: 18,
    optimalComplexity: 'O(n × k log k) time using sorted key',
    description: 'Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.',
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]', explanation: 'Group by sorted character key.' }
    ],
    testCases: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]', hidden: false },
      { input: 'strs = [""]', expectedOutput: '[[""]]', hidden: true }
    ],
    companyNotes: {
      Amazon: `"Can you use a character-frequency tuple as key instead of sorting? That gives O(n×k)."`,
      Apple: `Elegant use of hash map with canonical key form expected — no nested loops.`
    },
    starterCode: {
      javascript: `function groupAnagrams(strs) {\n  const map = new Map();\n  for (let s of strs) {\n    const key = s.split('').sort().join('');\n    if (!map.has(key)) map.set(key, []);\n    map.get(key).push(s);\n  }\n  return [...map.values()];\n}`,
      python: `from collections import defaultdict\ndef group_anagrams(strs):\n    d = defaultdict(list)\n    for s in strs: d[tuple(sorted(s))].append(s)\n    return list(d.values())`,
      cpp: `vector<vector<string>> groupAnagrams(vector<string>& strs) {\n    unordered_map<string,vector<string>> mp;\n    for(string s:strs) { string k=s; sort(k.begin(),k.end()); mp[k].push_back(s); }\n    vector<vector<string>> res;\n    for(auto& p:mp) res.push_back(p.second);\n    return res;\n}`,
      java: `public List<List<String>> groupAnagrams(String[] strs) {\n    Map<String,List<String>> mp=new HashMap<>();\n    for(String s:strs) { char[] ch=s.toCharArray(); Arrays.sort(ch); String k=new String(ch); mp.computeIfAbsent(k,x->new ArrayList<>()).add(s); }\n    return new ArrayList<>(mp.values());\n}`
    }
  },
  {
    id: 'subarray-sum-k',
    title: 'Subarray Sum Equals K',
    topic: 'Arrays',
    difficulty: 'Medium',
    companiesAsked: ['Amazon', 'Microsoft', 'Flipkart', 'Swiggy', 'JP Morgan'],
    expectedTimeMinutes: 20,
    optimalComplexity: 'O(n) time, O(n) space',
    description: 'Given an integer array `nums` and an integer `k`, return the total number of subarrays whose sum equals `k`.',
    examples: [
      { input: 'nums = [1,1,1], k = 2', output: '2', explanation: '[1,1] at indices [0,1] and [1,2].' }
    ],
    testCases: [
      { input: 'nums = [1,1,1], k = 2', expectedOutput: '2', hidden: false },
      { input: 'nums = [1,2,3], k = 3', expectedOutput: '2', hidden: true }
    ],
    companyNotes: {
      Amazon: `Prefix sum + HashMap pattern — interviewer will push for the O(n) approach after O(n²) brute force.`,
      'JP Morgan': `Financial systems analogy: finding transaction windows where the net change equals target amount.`
    },
    starterCode: {
      javascript: `function subarraySum(nums, k) {\n  const map = new Map([[0, 1]]);\n  let sum = 0, count = 0;\n  for (let n of nums) {\n    sum += n;\n    count += (map.get(sum - k) || 0);\n    map.set(sum, (map.get(sum) || 0) + 1);\n  }\n  return count;\n}`,
      python: `def subarray_sum(nums, k):\n    from collections import defaultdict\n    prefix = defaultdict(int); prefix[0]=1\n    s=0; cnt=0\n    for n in nums:\n        s+=n; cnt+=prefix[s-k]; prefix[s]+=1\n    return cnt`,
      cpp: `int subarraySum(vector<int>& nums, int k) {\n    unordered_map<int,int> mp; mp[0]=1;\n    int s=0,cnt=0;\n    for(int n:nums){s+=n;cnt+=mp[s-k];mp[s]++;}\n    return cnt;\n}`,
      java: `public int subarraySum(int[] nums, int k) {\n    Map<Integer,Integer> mp=new HashMap<>(); mp.put(0,1);\n    int s=0,cnt=0;\n    for(int n:nums){s+=n;cnt+=mp.getOrDefault(s-k,0);mp.merge(s,1,Integer::sum);}\n    return cnt;\n}`
    }
  },
  {
    id: 'container-with-most-water',
    title: 'Container With Most Water',
    topic: 'Arrays',
    difficulty: 'Medium',
    companiesAsked: ['Apple', 'Amazon', 'Adobe', 'Swiggy'],
    expectedTimeMinutes: 15,
    optimalComplexity: 'O(n) time, O(1) space',
    description: 'Given n non-negative integers representing heights at positions, find two lines that together with the x-axis form a container holding the most water.',
    examples: [
      { input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49', explanation: 'Lines at index 1 and 8: min(8,7)×7=49.' }
    ],
    testCases: [
      { input: 'height = [1,8,6,2,5,4,8,3,7]', expectedOutput: '49', hidden: false },
      { input: 'height = [1,1]', expectedOutput: '1', hidden: true }
    ],
    companyNotes: {
      Apple: `Two-pointer approach is the expected O(n) answer — brute force O(n²) will be pointed out.`,
      Amazon: `"Why does moving the smaller pointer always work? Can you prove the invariant?"`
    },
    starterCode: {
      javascript: `function maxArea(height) {\n  let l = 0, r = height.length-1, max = 0;\n  while (l < r) {\n    max = Math.max(max, Math.min(height[l], height[r]) * (r-l));\n    if (height[l] < height[r]) l++; else r--;\n  }\n  return max;\n}`,
      python: `def max_area(height):\n    l,r,mx = 0,len(height)-1,0\n    while l<r:\n        mx=max(mx,min(height[l],height[r])*(r-l))\n        if height[l]<height[r]: l+=1\n        else: r-=1\n    return mx`,
      cpp: `int maxArea(vector<int>& h) {\n    int l=0,r=h.size()-1,mx=0;\n    while(l<r){mx=max(mx,min(h[l],h[r])*(r-l));if(h[l]<h[r])l++;else r--;}\n    return mx;\n}`,
      java: `public int maxArea(int[] h) {\n    int l=0,r=h.length-1,mx=0;\n    while(l<r){mx=Math.max(mx,Math.min(h[l],h[r])*(r-l));if(h[l]<h[r])l++;else r--;}\n    return mx;\n}`
    }
  },
  {
    id: 'search-rotated-sorted-array',
    title: 'Search in Rotated Sorted Array',
    topic: 'Binary Search',
    difficulty: 'Medium',
    companiesAsked: ['Amazon', 'Microsoft', 'Adobe', 'Apple'],
    expectedTimeMinutes: 20,
    optimalComplexity: 'O(log n) time, O(1) space',
    description: 'Given an integer array `nums` sorted in ascending order that has been rotated, and an integer target, return the index of target if it is in nums, or -1 otherwise.',
    examples: [
      { input: 'nums = [4,5,6,7,0,1,2], target = 0', output: '4', explanation: '0 is at index 4.' }
    ],
    testCases: [
      { input: 'nums = [4,5,6,7,0,1,2], target = 0', expectedOutput: '4', hidden: false },
      { input: 'nums = [4,5,6,7,0,1,2], target = 3', expectedOutput: '-1', hidden: true }
    ],
    companyNotes: {
      Amazon: `"What if the array can contain duplicates? How does that affect the O(log n) guarantee?"`,
      Microsoft: `Modified binary search must correctly identify which half is sorted before narrowing.`
    },
    starterCode: {
      javascript: `function search(nums, target) {\n  let l = 0, r = nums.length-1;\n  while (l <= r) {\n    const m = (l+r)>>1;\n    if (nums[m] === target) return m;\n    if (nums[l] <= nums[m]) {\n      if (nums[l] <= target && target < nums[m]) r = m-1; else l = m+1;\n    } else {\n      if (nums[m] < target && target <= nums[r]) l = m+1; else r = m-1;\n    }\n  }\n  return -1;\n}`,
      python: `def search(nums, target):\n    l,r = 0,len(nums)-1\n    while l<=r:\n        m=(l+r)//2\n        if nums[m]==target: return m\n        if nums[l]<=nums[m]:\n            if nums[l]<=target<nums[m]: r=m-1\n            else: l=m+1\n        else:\n            if nums[m]<target<=nums[r]: l=m+1\n            else: r=m-1\n    return -1`,
      cpp: `int search(vector<int>& nums, int target) {\n    int l=0,r=nums.size()-1;\n    while(l<=r){int m=(l+r)/2;if(nums[m]==target)return m;if(nums[l]<=nums[m]){if(nums[l]<=target&&target<nums[m])r=m-1;else l=m+1;}else{if(nums[m]<target&&target<=nums[r])l=m+1;else r=m-1;}}\n    return -1;\n}`,
      java: `public int search(int[] nums, int target) {\n    int l=0,r=nums.length-1;\n    while(l<=r){int m=(l+r)/2;if(nums[m]==target)return m;if(nums[l]<=nums[m]){if(nums[l]<=target&&target<nums[m])r=m-1;else l=m+1;}else{if(nums[m]<target&&target<=nums[r])l=m+1;else r=m-1;}}\n    return -1;\n}`
    }
  },
  {
    id: 'longest-common-subsequence',
    title: 'Longest Common Subsequence',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    companiesAsked: ['Amazon', 'Microsoft', 'Adobe', 'JP Morgan'],
    expectedTimeMinutes: 20,
    optimalComplexity: 'O(m×n) time, O(m×n) space (or O(n) with space optimization)',
    description: 'Given two strings `text1` and `text2`, return the length of their longest common subsequence.',
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: '3', explanation: 'LCS is "ace" with length 3.' }
    ],
    testCases: [
      { input: 'text1 = "abcde", text2 = "ace"', expectedOutput: '3', hidden: false },
      { input: 'text1 = "abc", text2 = "def"', expectedOutput: '0', hidden: true }
    ],
    companyNotes: {
      Amazon: `"How can you reduce space from O(m×n) to O(n)? Walk through the optimization."`,
      'JP Morgan': `Document diff algorithms (like git diff) are based on LCS — common interview hook.`
    },
    starterCode: {
      javascript: `function longestCommonSubsequence(text1, text2) {\n  const m = text1.length, n = text2.length;\n  const dp = Array.from({length: m+1}, () => new Array(n+1).fill(0));\n  for (let i = 1; i <= m; i++)\n    for (let j = 1; j <= n; j++)\n      dp[i][j] = text1[i-1]===text2[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j], dp[i][j-1]);\n  return dp[m][n];\n}`,
      python: `def longest_common_subsequence(text1, text2):\n    m,n=len(text1),len(text2)\n    dp=[[0]*(n+1) for _ in range(m+1)]\n    for i in range(1,m+1):\n        for j in range(1,n+1):\n            dp[i][j]=dp[i-1][j-1]+1 if text1[i-1]==text2[j-1] else max(dp[i-1][j],dp[i][j-1])\n    return dp[m][n]`,
      cpp: `int longestCommonSubsequence(string t1, string t2) {\n    int m=t1.size(),n=t2.size(); vector<vector<int>> dp(m+1,vector<int>(n+1,0));\n    for(int i=1;i<=m;i++) for(int j=1;j<=n;j++) dp[i][j]=t1[i-1]==t2[j-1]?dp[i-1][j-1]+1:max(dp[i-1][j],dp[i][j-1]);\n    return dp[m][n];\n}`,
      java: `public int longestCommonSubsequence(String t1, String t2) {\n    int m=t1.length(),n=t2.length(); int[][] dp=new int[m+1][n+1];\n    for(int i=1;i<=m;i++) for(int j=1;j<=n;j++) dp[i][j]=t1.charAt(i-1)==t2.charAt(j-1)?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);\n    return dp[m][n];\n}`
    }
  },
  {
    id: 'word-break',
    title: 'Word Break',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    companiesAsked: ['Amazon', 'Microsoft', 'Flipkart', 'Adobe'],
    expectedTimeMinutes: 20,
    optimalComplexity: 'O(n²) time, O(n) space',
    description: 'Given a string `s` and a dictionary of strings `wordDict`, return true if `s` can be segmented into a space-separated sequence of one or more dictionary words.',
    examples: [
      { input: 's = "leetcode", wordDict = ["leet","code"]', output: 'true', explanation: '"leet" + "code".' }
    ],
    testCases: [
      { input: 's = "leetcode", wordDict = ["leet","code"]', expectedOutput: 'true', hidden: false },
      { input: 's = "catsandog", wordDict = ["cats","dog","sand","and","cat"]', expectedOutput: 'false', hidden: true }
    ],
    companyNotes: {
      Amazon: `"How would you extend this to return all valid segmentations?" — pushes toward backtracking with memoization.`,
      Flipkart: `Product categorization and URL slug parsing use similar logic.`
    },
    starterCode: {
      javascript: `function wordBreak(s, wordDict) {\n  const set = new Set(wordDict);\n  const dp = new Array(s.length+1).fill(false);\n  dp[0] = true;\n  for (let i = 1; i <= s.length; i++)\n    for (let j = 0; j < i; j++)\n      if (dp[j] && set.has(s.slice(j,i))) { dp[i] = true; break; }\n  return dp[s.length];\n}`,
      python: `def word_break(s, wordDict):\n    words=set(wordDict); n=len(s)\n    dp=[False]*(n+1); dp[0]=True\n    for i in range(1,n+1):\n        for j in range(i):\n            if dp[j] and s[j:i] in words: dp[i]=True; break\n    return dp[n]`,
      cpp: `bool wordBreak(string s, vector<string>& wordDict) {\n    set<string> ws(wordDict.begin(),wordDict.end()); int n=s.size();\n    vector<bool> dp(n+1,false); dp[0]=true;\n    for(int i=1;i<=n;i++) for(int j=0;j<i;j++) if(dp[j]&&ws.count(s.substr(j,i-j))){dp[i]=true;break;}\n    return dp[n];\n}`,
      java: `public boolean wordBreak(String s, List<String> wordDict) {\n    Set<String> ws=new HashSet<>(wordDict); int n=s.length();\n    boolean[] dp=new boolean[n+1]; dp[0]=true;\n    for(int i=1;i<=n;i++) for(int j=0;j<i;j++) if(dp[j]&&ws.contains(s.substring(j,i))){dp[i]=true;break;}\n    return dp[n];\n}`
    }
  },
  {
    id: 'max-product-subarray',
    title: 'Maximum Product Subarray',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    companiesAsked: ['Amazon', 'Apple', 'Swiggy', 'Flipkart'],
    expectedTimeMinutes: 18,
    optimalComplexity: 'O(n) time, O(1) space',
    description: 'Given an integer array `nums`, find a contiguous subarray that has the largest product, and return the product.',
    examples: [
      { input: 'nums = [2,3,-2,4]', output: '6', explanation: '[2,3] has product 6.' }
    ],
    testCases: [
      { input: 'nums = [2,3,-2,4]', expectedOutput: '6', hidden: false },
      { input: 'nums = [-2,0,-1]', expectedOutput: '0', hidden: true }
    ],
    companyNotes: {
      Amazon: `"Why do we track both max and min at each step? Hint: negative × negative."`,
      Apple: `Edge case: what happens with a single negative number? Verify your solution handles it.`
    },
    starterCode: {
      javascript: `function maxProduct(nums) {\n  let max = nums[0], min = nums[0], res = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    const tmp = max;\n    max = Math.max(nums[i], max*nums[i], min*nums[i]);\n    min = Math.min(nums[i], tmp*nums[i], min*nums[i]);\n    res = Math.max(res, max);\n  }\n  return res;\n}`,
      python: `def max_product(nums):\n    mx=mn=res=nums[0]\n    for n in nums[1:]:\n        mx,mn=max(n,mx*n,mn*n),min(n,mx*n,mn*n)\n        res=max(res,mx)\n    return res`,
      cpp: `int maxProduct(vector<int>& nums) {\n    int mx=nums[0],mn=nums[0],res=nums[0];\n    for(int i=1;i<nums.size();i++){int t=mx;mx=max({nums[i],mx*nums[i],mn*nums[i]});mn=min({nums[i],t*nums[i],mn*nums[i]});res=max(res,mx);}\n    return res;\n}`,
      java: `public int maxProduct(int[] nums) {\n    int mx=nums[0],mn=nums[0],res=nums[0];\n    for(int i=1;i<nums.length;i++){int t=mx;mx=Math.max(nums[i],Math.max(mx*nums[i],mn*nums[i]));mn=Math.min(nums[i],Math.min(t*nums[i],mn*nums[i]));res=Math.max(res,mx);}\n    return res;\n}`
    }
  },
  {
    id: 'find-peak-element',
    title: 'Find Peak Element',
    topic: 'Binary Search',
    difficulty: 'Medium',
    companiesAsked: ['Microsoft', 'Apple', 'JP Morgan', 'Adobe'],
    expectedTimeMinutes: 15,
    optimalComplexity: 'O(log n) time, O(1) space',
    description: 'A peak element is an element strictly greater than its neighbors. Given an array where no two adjacent elements are equal, find a peak element and return its index. You must write an O(log n) algorithm.',
    examples: [
      { input: 'nums = [1,2,3,1]', output: '2', explanation: '3 at index 2 is a peak (3 > 2 and 3 > 1).' }
    ],
    testCases: [
      { input: 'nums = [1,2,3,1]', expectedOutput: '2', hidden: false },
      { input: 'nums = [1,2,1,3,5,6,4]', expectedOutput: '5', hidden: true }
    ],
    companyNotes: {
      Microsoft: `"Why can binary search work here even without a sorted array? What is the invariant?"`,
      Apple: `Boundary conditions matter — handle single element and descending arrays.`
    },
    starterCode: {
      javascript: `function findPeakElement(nums) {\n  let l = 0, r = nums.length-1;\n  while (l < r) {\n    const m = (l+r)>>1;\n    if (nums[m] > nums[m+1]) r = m; else l = m+1;\n  }\n  return l;\n}`,
      python: `def find_peak_element(nums):\n    l,r=0,len(nums)-1\n    while l<r:\n        m=(l+r)//2\n        if nums[m]>nums[m+1]: r=m\n        else: l=m+1\n    return l`,
      cpp: `int findPeakElement(vector<int>& nums) {\n    int l=0,r=nums.size()-1;\n    while(l<r){int m=(l+r)/2;if(nums[m]>nums[m+1])r=m;else l=m+1;}\n    return l;\n}`,
      java: `public int findPeakElement(int[] nums) {\n    int l=0,r=nums.length-1;\n    while(l<r){int m=(l+r)/2;if(nums[m]>nums[m+1])r=m;else l=m+1;}\n    return l;\n}`
    }
  }
];

// ─────────────────────────────────────────────────────────────
// HARD (12) — tagged to FAANG/GS/Uber
// Google, Meta, Netflix, Amazon, Uber, Goldman Sachs
// ─────────────────────────────────────────────────────────────
const HARD_QUESTIONS = [
  {
    id: 'number-of-islands',
    title: 'Number of Islands',
    topic: 'Graphs',
    difficulty: 'Hard',
    companiesAsked: ['Google', 'Amazon', 'Meta', 'Uber'],
    expectedTimeMinutes: 20,
    optimalComplexity: 'O(m×n) time, O(m×n) space',
    description: 'Given an m×n 2D binary grid representing land (1) and water (0), return the number of islands. An island is surrounded by water and formed by connecting adjacent lands horizontally or vertically.',
    examples: [
      { input: 'grid = [["1","1","0"],["0","1","0"],["0","0","1"]]', output: '2', explanation: '2 separate connected land masses via DFS/BFS.' }
    ],
    testCases: [
      { input: 'grid = [["1","1","0"],["0","1","0"],["0","0","1"]]', expectedOutput: '2', hidden: false },
      { input: 'grid = [["1","1","1"],["1","1","0"],["0","0","0"]]', expectedOutput: '1', hidden: true }
    ],
    companyNotes: {
      Google: `Follow-up: "How would you solve this if the grid is infinite and distributed across multiple servers?" — design a distributed BFS.`,
      Amazon: `"How does this apply to disconnected service cluster discovery?" — relate to your system design experience.`,
      Uber: `"Count connected regions in a city map — same algorithm, geo-spatial framing."`
    },
    starterCode: {
      javascript: `function numIslands(grid) {\n  let count = 0;\n  const rows = grid.length, cols = grid[0].length;\n  function dfs(r, c) {\n    if (r<0||c<0||r>=rows||c>=cols||grid[r][c]==='0') return;\n    grid[r][c]='0';\n    dfs(r+1,c);dfs(r-1,c);dfs(r,c+1);dfs(r,c-1);\n  }\n  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) if(grid[r][c]==='1'){count++;dfs(r,c);}\n  return count;\n}`,
      python: `def num_islands(grid):\n    rows,cols=len(grid),len(grid[0]); count=0\n    def dfs(r,c):\n        if r<0 or c<0 or r>=rows or c>=cols or grid[r][c]=='0': return\n        grid[r][c]='0'\n        dfs(r+1,c);dfs(r-1,c);dfs(r,c+1);dfs(r,c-1)\n    for r in range(rows):\n        for c in range(cols):\n            if grid[r][c]=='1': count+=1; dfs(r,c)\n    return count`,
      cpp: `int numIslands(vector<vector<char>>& grid) {\n    int r=grid.size(),c=grid[0].size(),cnt=0;\n    function<void(int,int)> dfs=[&](int i,int j){\n        if(i<0||j<0||i>=r||j>=c||grid[i][j]=='0')return;\n        grid[i][j]='0';dfs(i+1,j);dfs(i-1,j);dfs(i,j+1);dfs(i,j-1);\n    };\n    for(int i=0;i<r;i++)for(int j=0;j<c;j++)if(grid[i][j]=='1'){cnt++;dfs(i,j);}\n    return cnt;\n}`,
      java: `public int numIslands(char[][] grid) {\n    int r=grid.length,c=grid[0].length,cnt=0;\n    for(int i=0;i<r;i++)for(int j=0;j<c;j++)if(grid[i][j]=='1'){cnt++;dfs(grid,i,j);}\n    return cnt;\n}\nvoid dfs(char[][] g,int i,int j){\n    if(i<0||j<0||i>=g.length||j>=g[0].length||g[i][j]=='0')return;\n    g[i][j]='0';dfs(g,i+1,j);dfs(g,i-1,j);dfs(g,i,j+1);dfs(g,i,j-1);\n}`
    }
  },
  {
    id: 'lru-cache',
    title: 'LRU Cache Design',
    topic: 'Arrays',
    difficulty: 'Hard',
    companiesAsked: ['Google', 'Meta', 'Netflix', 'Uber', 'Amazon'],
    expectedTimeMinutes: 25,
    optimalComplexity: 'O(1) time for get & put, O(capacity) space',
    description: 'Design a data structure following the LRU (Least Recently Used) cache constraints. Implement get(key) returning value or -1, and put(key, value). When the capacity is reached, evict the least recently used key before insertion.',
    examples: [
      { input: 'capacity=2, put(1,1), put(2,2), get(1)=1, put(3,3), get(2)=-1', output: '1,-1', explanation: 'Key 2 was evicted as it was LRU when key 3 was inserted.' }
    ],
    testCases: [
      { input: 'capacity=2,ops=[[put,1,1],[put,2,2],[get,1],[put,3,3],[get,2]]', expectedOutput: '1,-1', hidden: false }
    ],
    companyNotes: {
      Google: `Expect a detailed walk-through of the doubly linked list + hash map design. Time and space complexity must be proven.`,
      Netflix: `"How would you shard this LRU cache across 100 nodes for a global streaming CDN?"`,
      Uber: `"Our dispatch cache uses an LRU variant — how does invalidation work when a driver goes offline?"`
    },
    starterCode: {
      javascript: `class LRUCache {\n  constructor(capacity) {\n    this.cap = capacity;\n    this.cache = new Map();\n  }\n  get(key) {\n    if (!this.cache.has(key)) return -1;\n    const val = this.cache.get(key);\n    this.cache.delete(key);\n    this.cache.set(key, val);\n    return val;\n  }\n  put(key, value) {\n    if (this.cache.has(key)) this.cache.delete(key);\n    else if (this.cache.size >= this.cap) this.cache.delete(this.cache.keys().next().value);\n    this.cache.set(key, value);\n  }\n}`,
      python: `from collections import OrderedDict\nclass LRUCache:\n    def __init__(self, capacity):\n        self.cap = capacity\n        self.cache = OrderedDict()\n    def get(self, key):\n        if key not in self.cache: return -1\n        self.cache.move_to_end(key)\n        return self.cache[key]\n    def put(self, key, value):\n        if key in self.cache: self.cache.move_to_end(key)\n        self.cache[key] = value\n        if len(self.cache) > self.cap: self.cache.popitem(last=False)`,
      cpp: `class LRUCache {\n    int cap; list<pair<int,int>> lst; unordered_map<int,list<pair<int,int>>::iterator> mp;\npublic:\n    LRUCache(int c):cap(c){}\n    int get(int k){if(!mp.count(k))return -1;lst.splice(lst.begin(),lst,mp[k]);return mp[k]->second;}\n    void put(int k,int v){if(mp.count(k)){lst.splice(lst.begin(),lst,mp[k]);mp[k]->second=v;}else{if((int)lst.size()==cap){mp.erase(lst.back().first);lst.pop_back();}lst.push_front({k,v});mp[k]=lst.begin();}}\n};`,
      java: `class LRUCache extends LinkedHashMap<Integer,Integer> {\n    int cap;\n    public LRUCache(int capacity){super(capacity,0.75f,true);this.cap=capacity;}\n    public int get(int key){return super.getOrDefault(key,-1);}\n    public void put(int key,int value){super.put(key,value);}\n    protected boolean removeEldestEntry(Map.Entry<Integer,Integer> e){return size()>cap;}\n}`
    }
  },
  {
    id: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    topic: 'Arrays',
    difficulty: 'Hard',
    companiesAsked: ['Google', 'Amazon', 'Goldman Sachs', 'Meta'],
    expectedTimeMinutes: 25,
    optimalComplexity: 'O(n) time, O(1) space (two-pointer)',
    description: 'Given n non-negative integers representing an elevation map where width of each bar is 1, compute how much water it can trap after raining.',
    examples: [
      { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', explanation: 'Water is trapped in the valleys.' }
    ],
    testCases: [
      { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', expectedOutput: '6', hidden: false },
      { input: 'height = [4,2,0,3,2,5]', expectedOutput: '9', hidden: true }
    ],
    companyNotes: {
      Google: "Follow-up: Can you explain the O(1) space two-pointer approach and prove it is correct?",
      'Goldman Sachs': "This parallels computing max drawdown in a trading portfolio - same min/max tracking principle.",
      Amazon: "How would you handle a 3D elevation map version? Lead into the 3D BFS variant."
    },
    starterCode: {
      javascript: `function trap(height) {\n  let l=0, r=height.length-1, lMax=0, rMax=0, water=0;\n  while(l<r) {\n    if(height[l]<height[r]) {\n      height[l]>=lMax ? lMax=height[l] : water+=lMax-height[l];\n      l++;\n    } else {\n      height[r]>=rMax ? rMax=height[r] : water+=rMax-height[r];\n      r--;\n    }\n  }\n  return water;\n}`,
      python: `def trap(height):\n    l,r,lm,rm,w=0,len(height)-1,0,0,0\n    while l<r:\n        if height[l]<height[r]:\n            lm=max(lm,height[l]); w+=lm-height[l]; l+=1\n        else:\n            rm=max(rm,height[r]); w+=rm-height[r]; r-=1\n    return w`,
      cpp: `int trap(vector<int>& h) {\n    int l=0,r=h.size()-1,lm=0,rm=0,w=0;\n    while(l<r){if(h[l]<h[r]){lm=max(lm,h[l]);w+=lm-h[l++];}else{rm=max(rm,h[r]);w+=rm-h[r--];}}\n    return w;\n}`,
      java: `public int trap(int[] h) {\n    int l=0,r=h.length-1,lm=0,rm=0,w=0;\n    while(l<r){if(h[l]<h[r]){lm=Math.max(lm,h[l]);w+=lm-h[l++];}else{rm=Math.max(rm,h[r]);w+=rm-h[r--];}}\n    return w;\n}`
    }
  },
  {
    id: 'minimum-window-substring',
    title: 'Minimum Window Substring',
    topic: 'Sliding Window',
    difficulty: 'Hard',
    companiesAsked: ['Google', 'Meta', 'Uber', 'Goldman Sachs'],
    expectedTimeMinutes: 25,
    optimalComplexity: 'O(m+n) time, O(m+n) space',
    description: 'Given strings `s` and `t`, return the minimum window substring of `s` such that every character in `t` (including duplicates) is included in the window. Return "" if no such window exists.',
    examples: [
      { input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"', explanation: 'Smallest window containing A, B, C.' }
    ],
    testCases: [
      { input: 's = "ADOBECODEBANC", t = "ABC"', expectedOutput: '"BANC"', hidden: false },
      { input: 's = "a", t = "a"', expectedOutput: '"a"', hidden: true }
    ],
    companyNotes: {
      Google: `Expect follow-up: "What if you need to find all minimum windows? Return all valid positions."`,
      Meta: `"How does this extend to finding windows containing at least K distinct characters?"`,
      Uber: `"This is used in location string matching — finding the smallest route segment that satisfies all waypoints."`
    },
    starterCode: {
      javascript: `function minWindow(s, t) {\n  const need = {}, have = {};\n  for (let c of t) need[c] = (need[c]||0)+1;\n  let formed=0, required=Object.keys(need).length;\n  let l=0, min=[Infinity,0,0];\n  for (let r=0;r<s.length;r++) {\n    const c=s[r]; have[c]=(have[c]||0)+1;\n    if(need[c]&&have[c]===need[c]) formed++;\n    while(formed===required){\n      if(r-l+1<min[0]) min=[r-l+1,l,r];\n      have[s[l]]--;\n      if(need[s[l]]&&have[s[l]]<need[s[l]]) formed--;\n      l++;\n    }\n  }\n  return min[0]===Infinity?'':s.slice(min[1],min[2]+1);\n}`,
      python: `from collections import Counter\ndef min_window(s, t):\n    need=Counter(t); have={}; formed=0; req=len(need)\n    l=0; mn=(float('inf'),0,0)\n    for r,c in enumerate(s):\n        have[c]=have.get(c,0)+1\n        if c in need and have[c]==need[c]: formed+=1\n        while formed==req:\n            if r-l+1<mn[0]: mn=(r-l+1,l,r)\n            have[s[l]]-=1\n            if s[l] in need and have[s[l]]<need[s[l]]: formed-=1\n            l+=1\n    return '' if mn[0]==float('inf') else s[mn[1]:mn[2]+1]`,
      cpp: `string minWindow(string s, string t) {\n    unordered_map<char,int> need,have;\n    for(char c:t) need[c]++;\n    int formed=0,req=need.size(),l=0,mn=INT_MAX,ml=0;\n    for(int r=0;r<s.size();r++){have[s[r]]++;if(need.count(s[r])&&have[s[r]]==need[s[r]])formed++;while(formed==req){if(r-l+1<mn){mn=r-l+1;ml=l;}have[s[l]]--;if(need.count(s[l])&&have[s[l]]<need[s[l]])formed--;l++;}}\n    return mn==INT_MAX?'':s.substr(ml,mn);\n}`,
      java: `public String minWindow(String s, String t) {\n    Map<Character,Integer> need=new HashMap<>(),have=new HashMap<>();\n    for(char c:t.toCharArray()) need.merge(c,1,Integer::sum);\n    int formed=0,req=need.size(),l=0,mn=Integer.MAX_VALUE,ml=0;\n    for(int r=0;r<s.length();r++){char c=s.charAt(r);have.merge(c,1,Integer::sum);if(need.containsKey(c)&&have.get(c).equals(need.get(c)))formed++;while(formed==req){if(r-l+1<mn){mn=r-l+1;ml=l;}char lc=s.charAt(l);have.merge(lc,-1,Integer::sum);if(need.containsKey(lc)&&have.get(lc)<need.get(lc))formed--;l++;}}\n    return mn==Integer.MAX_VALUE?'':s.substring(ml,ml+mn);\n}`
    }
  },
  {
    id: 'word-ladder',
    title: 'Word Ladder (Shortest Transformation)',
    topic: 'Graphs',
    difficulty: 'Hard',
    companiesAsked: ['Google', 'Meta', 'Amazon', 'Goldman Sachs'],
    expectedTimeMinutes: 30,
    optimalComplexity: 'O(M² × N) where M=word length, N=dict size',
    description: 'Given two words `beginWord` and `endWord`, and a dictionary `wordList`, return the number of words in the shortest transformation sequence from beginWord to endWord. Return 0 if no path exists.',
    examples: [
      { input: 'beginWord="hit", endWord="cog", wordList=["hot","dot","dog","lot","log","cog"]', output: '5', explanation: '"hit"→"hot"→"dot"→"dog"→"cog" = 5 words.' }
    ],
    testCases: [
      { input: 'beginWord="hit",endWord="cog",wordList=["hot","dot","dog","lot","log","cog"]', expectedOutput: '5', hidden: false },
      { input: 'beginWord="hit",endWord="cog",wordList=["hot","dot","dog","lot","log"]', expectedOutput: '0', hidden: true }
    ],
    companyNotes: {
      Google: `Classic BFS graph problem. Follow-up: "How does bidirectional BFS cut the search space and why?"`,
      Amazon: `"How would you scale this to a 10M word dictionary? Consider preprocessing intermediate states."`
    },
    starterCode: {
      javascript: `function ladderLength(beginWord, endWord, wordList) {\n  const wordSet = new Set(wordList);\n  if (!wordSet.has(endWord)) return 0;\n  const q = [[beginWord, 1]];\n  while (q.length) {\n    const [word, steps] = q.shift();\n    for (let i = 0; i < word.length; i++) {\n      for (let c = 97; c <= 122; c++) {\n        const next = word.slice(0,i)+String.fromCharCode(c)+word.slice(i+1);\n        if (next === endWord) return steps+1;\n        if (wordSet.has(next)) { wordSet.delete(next); q.push([next,steps+1]); }\n      }\n    }\n  }\n  return 0;\n}`,
      python: `from collections import deque\ndef ladder_length(beginWord, endWord, wordList):\n    wordSet=set(wordList)\n    if endWord not in wordSet: return 0\n    q=deque([(beginWord,1)])\n    while q:\n        word,steps=q.popleft()\n        for i in range(len(word)):\n            for c in 'abcdefghijklmnopqrstuvwxyz':\n                nw=word[:i]+c+word[i+1:]\n                if nw==endWord: return steps+1\n                if nw in wordSet: wordSet.remove(nw); q.append((nw,steps+1))\n    return 0`,
      cpp: `int ladderLength(string bw, string ew, vector<string>& wl) {\n    unordered_set<string> ws(wl.begin(),wl.end());\n    if(!ws.count(ew)) return 0;\n    queue<pair<string,int>> q; q.push({bw,1});\n    while(!q.empty()){auto [w,s]=q.front();q.pop();for(int i=0;i<w.size();i++){string nw=w;for(char c='a';c<='z';c++){nw[i]=c;if(nw==ew)return s+1;if(ws.count(nw)){ws.erase(nw);q.push({nw,s+1});}}}}\n    return 0;\n}`,
      java: `public int ladderLength(String bw, String ew, List<String> wl) {\n    Set<String> ws=new HashSet<>(wl); if(!ws.contains(ew)) return 0;\n    Queue<String> q=new LinkedList<>(); q.offer(bw); int steps=1;\n    while(!q.isEmpty()){int sz=q.size();for(int i=0;i<sz;i++){String w=q.poll();for(int j=0;j<w.length();j++){for(char c='a';c<='z';c++){String nw=w.substring(0,j)+c+w.substring(j+1);if(nw.equals(ew))return steps+1;if(ws.contains(nw)){ws.remove(nw);q.offer(nw);}}}}
    steps++;}
    return 0;
}`
    }
  },
  {
    id: 'course-schedule-ii',
    title: 'Course Schedule II (Topological Sort)',
    topic: 'Graphs',
    difficulty: 'Hard',
    companiesAsked: ['Google', 'Meta', 'Amazon', 'Uber'],
    expectedTimeMinutes: 25,
    optimalComplexity: 'O(V+E) time, O(V+E) space',
    description: 'Given numCourses and prerequisites pairs [a, b] meaning course a depends on course b, return a valid ordering. Return empty if impossible.',
    examples: [
      { input: 'numCourses=4, prerequisites=[[1,0],[2,0],[3,1],[3,2]]', output: '[0,2,1,3]', explanation: 'Valid topological ordering.' }
    ],
    testCases: [
      { input: 'numCourses=2, prerequisites=[[1,0]]', expectedOutput: '[0,1]', hidden: false },
      { input: 'numCourses=2, prerequisites=[[1,0],[0,1]]', expectedOutput: '[]', hidden: true }
    ],
    companyNotes: {
      Google: "Detect a cycle with BFS (Kahn algorithm) vs DFS - choose based on whether you need ordering or just cycle detection.",
      Uber: "Build order for microservice deployments follows this exact pattern - handle circular dependencies by returning empty."
    },
    starterCode: {
      javascript: `function findOrder(numCourses, prerequisites) {\n  const adj = Array.from({length:numCourses},()=>[]);\n  const indegree = new Array(numCourses).fill(0);\n  for(const [a,b] of prerequisites){adj[b].push(a);indegree[a]++;}\n  const q=[],res=[];\n  for(let i=0;i<numCourses;i++) if(indegree[i]===0) q.push(i);\n  while(q.length){const n=q.shift();res.push(n);for(const nb of adj[n]) if(--indegree[nb]===0) q.push(nb);}\n  return res.length===numCourses?res:[];\n}`,
      python: `from collections import deque\ndef find_order(numCourses, prerequisites):\n    adj=[[] for _ in range(numCourses)]; ind=[0]*numCourses\n    for a,b in prerequisites: adj[b].append(a); ind[a]+=1\n    q=deque(i for i in range(numCourses) if ind[i]==0); res=[]\n    while q:\n        n=q.popleft(); res.append(n)\n        for nb in adj[n]:\n            ind[nb]-=1\n            if ind[nb]==0: q.append(nb)\n    return res if len(res)==numCourses else []`,
      cpp: `vector<int> findOrder(int n, vector<vector<int>>& pre) {\n    vector<vector<int>> adj(n); vector<int> ind(n,0);\n    for(auto& p:pre){adj[p[1]].push_back(p[0]);ind[p[0]]++;}\n    queue<int> q; for(int i=0;i<n;i++) if(!ind[i]) q.push(i);\n    vector<int> res;\n    while(!q.empty()){int u=q.front();q.pop();res.push_back(u);for(int v:adj[u]) if(--ind[v]==0) q.push(v);}\n    return res.size()==n?res:vector<int>();\n}`,
      java: `public int[] findOrder(int n, int[][] pre) {\n    List<List<Integer>> adj=new ArrayList<>(); int[] ind=new int[n];\n    for(int i=0;i<n;i++) adj.add(new ArrayList<>());\n    for(int[] p:pre){adj.get(p[1]).add(p[0]);ind[p[0]]++;}\n    Queue<Integer> q=new LinkedList<>(); for(int i=0;i<n;i++) if(ind[i]==0) q.offer(i);\n    int[] res=new int[n]; int idx=0;\n    while(!q.isEmpty()){int u=q.poll();res[idx++]=u;for(int v:adj.get(u)) if(--ind[v]==0) q.offer(v);}\n    return idx==n?res:new int[]{};\n}`
    }
  },
  {
    id: 'edit-distance',
    title: 'Edit Distance (Levenshtein)',
    topic: 'Dynamic Programming',
    difficulty: 'Hard',
    companiesAsked: ['Google', 'Goldman Sachs', 'Meta', 'Amazon'],
    expectedTimeMinutes: 25,
    optimalComplexity: 'O(m×n) time, O(min(m,n)) space with optimization',
    description: 'Given two strings `word1` and `word2`, return the minimum number of operations (insert, delete, replace) to convert word1 to word2.',
    examples: [
      { input: 'word1 = "horse", word2 = "ros"', output: '3', explanation: 'horse→rorse→rose→ros (3 ops).' }
    ],
    testCases: [
      { input: 'word1 = "horse", word2 = "ros"', expectedOutput: '3', hidden: false },
      { input: 'word1 = "intention", word2 = "execution"', expectedOutput: '5', hidden: true }
    ],
    companyNotes: {
      Google: `"Can you reconstruct the actual edit path? Walk through the backtracking from the DP table."`,
      'Goldman Sachs': `"Edit distance is used in fuzzy financial instrument name matching — explain the practical relevance."`
    },
    starterCode: {
      javascript: `function minDistance(word1, word2) {\n  const m=word1.length, n=word2.length;\n  const dp=Array.from({length:m+1},(_,i)=>new Array(n+1).fill(0).map((_,j)=>i||j?i?j?0:i:j:0));\n  for(let i=0;i<=m;i++) dp[i][0]=i;\n  for(let j=0;j<=n;j++) dp[0][j]=j;\n  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++)\n    dp[i][j]=word1[i-1]===word2[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);\n  return dp[m][n];\n}`,
      python: `def min_distance(word1, word2):\n    m,n=len(word1),len(word2)\n    dp=[[0]*(n+1) for _ in range(m+1)]\n    for i in range(m+1): dp[i][0]=i\n    for j in range(n+1): dp[0][j]=j\n    for i in range(1,m+1):\n        for j in range(1,n+1):\n            dp[i][j]=dp[i-1][j-1] if word1[i-1]==word2[j-1] else 1+min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1])\n    return dp[m][n]`,
      cpp: `int minDistance(string w1, string w2) {\n    int m=w1.size(),n=w2.size(); vector<vector<int>> dp(m+1,vector<int>(n+1));\n    for(int i=0;i<=m;i++) dp[i][0]=i;\n    for(int j=0;j<=n;j++) dp[0][j]=j;\n    for(int i=1;i<=m;i++) for(int j=1;j<=n;j++) dp[i][j]=w1[i-1]==w2[j-1]?dp[i-1][j-1]:1+min({dp[i-1][j],dp[i][j-1],dp[i-1][j-1]});\n    return dp[m][n];\n}`,
      java: `public int minDistance(String w1, String w2) {\n    int m=w1.length(),n=w2.length(); int[][] dp=new int[m+1][n+1];\n    for(int i=0;i<=m;i++) dp[i][0]=i;\n    for(int j=0;j<=n;j++) dp[0][j]=j;\n    for(int i=1;i<=m;i++) for(int j=1;j<=n;j++) dp[i][j]=w1.charAt(i-1)==w2.charAt(j-1)?dp[i-1][j-1]:1+Math.min(dp[i-1][j],Math.min(dp[i][j-1],dp[i-1][j-1]));\n    return dp[m][n];\n}`
    }
  },
  {
    id: 'serialize-deserialize-tree',
    title: 'Serialize and Deserialize Binary Tree',
    topic: 'Trees',
    difficulty: 'Hard',
    companiesAsked: ['Google', 'Meta', 'Amazon', 'Netflix'],
    expectedTimeMinutes: 30,
    optimalComplexity: 'O(n) time, O(n) space',
    description: 'Design an algorithm to serialize a binary tree to a string and deserialize that string back to the tree. There is no restriction on your serialization/deserialization algorithm.',
    examples: [
      { input: 'root = [1,2,3,null,null,4,5]', output: '[1,2,3,null,null,4,5]', explanation: 'Any encoding that reconstructs the same tree.' }
    ],
    testCases: [
      { input: 'root = [1,2,3,null,null,4,5]', expectedOutput: '[1,2,3,null,null,4,5]', hidden: false }
    ],
    companyNotes: {
      Google: `"How does your serialization handle very deep trees? Stack overflow risk — convert recursion to iterative."`,
      Meta: `"Social graph serialization uses similar BFS-level encoding — relate to your design."`,
      Netflix: `"Content recommendation tree serialization for caching — discuss format efficiency vs readability trade-offs."`
    },
    starterCode: {
      javascript: `function serialize(root) {\n  if (!root) return 'null';\n  return root.val+','+serialize(root.left)+','+serialize(root.right);\n}\nfunction deserialize(data) {\n  const vals = data.split(',');\n  let idx = 0;\n  function build() {\n    if (vals[idx] === 'null') { idx++; return null; }\n    const node = { val: +vals[idx++], left: null, right: null };\n    node.left = build(); node.right = build();\n    return node;\n  }\n  return build();\n}`,
      python: `def serialize(root):\n    def enc(node):\n        if not node: res.append('null'); return\n        res.append(str(node.val)); enc(node.left); enc(node.right)\n    res=[]; enc(root); return ','.join(res)\ndef deserialize(data):\n    vals=iter(data.split(','))\n    def dec():\n        v=next(vals)\n        if v=='null': return None\n        n=TreeNode(int(v)); n.left=dec(); n.right=dec(); return n\n    return dec()`,
      cpp: `string serialize(TreeNode* root) {\n    if(!root) return 'N';\n    return to_string(root->val)+','+serialize(root->left)+','+serialize(root->right);\n}\nTreeNode* deserialize(string data) {\n    stringstream ss(data); string val; queue<string> q;\n    while(getline(ss,val,',')) q.push(val);\n    function<TreeNode*()> build=[&]()->TreeNode*{\n        string v=q.front();q.pop();if(v=='N') return nullptr;\n        TreeNode* n=new TreeNode(stoi(v)); n->left=build(); n->right=build(); return n;\n    }; return build();\n}`,
      java: `public String serialize(TreeNode root) {\n    if(root==null) return 'N';\n    return root.val+','+serialize(root.left)+','+serialize(root.right);\n}\npublic TreeNode deserialize(String data) {\n    Queue<String> q=new LinkedList<>(Arrays.asList(data.split(',')));\n    return build(q);\n}\nTreeNode build(Queue<String> q) {\n    String v=q.poll(); if(v.equals('N')) return null;\n    TreeNode n=new TreeNode(Integer.parseInt(v)); n.left=build(q); n.right=build(q); return n;\n}`
    }
  },
  {
    id: 'longest-consecutive-sequence',
    title: 'Longest Consecutive Sequence',
    topic: 'Arrays',
    difficulty: 'Hard',
    companiesAsked: ['Google', 'Meta', 'Uber'],
    expectedTimeMinutes: 20,
    optimalComplexity: 'O(n) time, O(n) space',
    description: 'Given an unsorted integer array `nums`, return the length of the longest consecutive elements sequence. Must run in O(n) time.',
    examples: [
      { input: 'nums = [100,4,200,1,3,2]', output: '4', explanation: '[1,2,3,4] — length 4.' }
    ],
    testCases: [
      { input: 'nums = [100,4,200,1,3,2]', expectedOutput: '4', hidden: false },
      { input: 'nums = [0,3,7,2,5,8,4,6,0,1]', expectedOutput: '9', hidden: true }
    ],
    companyNotes: {
      Google: `Key insight: only expand a sequence from its start element (n-1 not in set). Follow-up: space optimization.`,
      Meta: `"How would you handle streaming input where numbers arrive one at a time?"`
    },
    starterCode: {
      javascript: `function longestConsecutive(nums) {\n  const set = new Set(nums);\n  let max = 0;\n  for (const n of set) {\n    if (!set.has(n-1)) {\n      let cur = n, len = 1;\n      while (set.has(cur+1)) { cur++; len++; }\n      max = Math.max(max, len);\n    }\n  }\n  return max;\n}`,
      python: `def longest_consecutive(nums):\n    s=set(nums); mx=0\n    for n in s:\n        if n-1 not in s:\n            cur,l=n,1\n            while cur+1 in s: cur+=1; l+=1\n            mx=max(mx,l)\n    return mx`,
      cpp: `int longestConsecutive(vector<int>& nums) {\n    unordered_set<int> s(nums.begin(),nums.end()); int mx=0;\n    for(int n:s) if(!s.count(n-1)){int cur=n,l=1;while(s.count(cur+1)){cur++;l++;}mx=max(mx,l);}\n    return mx;\n}`,
      java: `public int longestConsecutive(int[] nums) {\n    Set<Integer> s=new HashSet<>(); for(int n:nums) s.add(n); int mx=0;\n    for(int n:s) if(!s.contains(n-1)){int cur=n,l=1;while(s.contains(cur+1)){cur++;l++;}mx=Math.max(mx,l);}\n    return mx;\n}`
    }
  },
  {
    id: 'median-two-sorted-arrays',
    title: 'Median of Two Sorted Arrays',
    topic: 'Binary Search',
    difficulty: 'Hard',
    companiesAsked: ['Google', 'Goldman Sachs', 'Amazon', 'Meta'],
    expectedTimeMinutes: 30,
    optimalComplexity: 'O(log(min(m,n))) time, O(1) space',
    description: 'Given two sorted arrays `nums1` and `nums2`, return the median of the two sorted arrays. Must achieve O(log(min(m,n))) time complexity.',
    examples: [
      { input: 'nums1 = [1,3], nums2 = [2]', output: '2.0', explanation: 'Merged [1,2,3], median = 2.' },
      { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.5', explanation: 'Merged [1,2,3,4], median = (2+3)/2 = 2.5.' }
    ],
    testCases: [
      { input: 'nums1 = [1,3], nums2 = [2]', expectedOutput: '2.0', hidden: false },
      { input: 'nums1 = [1,2], nums2 = [3,4]', expectedOutput: '2.5', hidden: true }
    ],
    companyNotes: {
      Google: `Hardest part: proving binary search on the partition is correct. Explain the invariant clearly — interviewers want to see your reasoning.`,
      'Goldman Sachs': `"Percentile calculations in financial risk modeling use similar partition logic — draw the parallel."`
    },
    starterCode: {
      javascript: `function findMedianSortedArrays(nums1, nums2) {\n  if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);\n  const m=nums1.length, n=nums2.length, half=(m+n+1)>>1;\n  let lo=0, hi=m;\n  while(lo<=hi){\n    const i=(lo+hi)>>1, j=half-i;\n    if(i<m&&nums1[i]<nums2[j-1]) lo=i+1;\n    else if(i>0&&nums1[i-1]>nums2[j]) hi=i-1;\n    else{\n      const maxL=Math.max(i>0?nums1[i-1]:-Infinity,j>0?nums2[j-1]:-Infinity);\n      if((m+n)%2) return maxL;\n      const minR=Math.min(i<m?nums1[i]:Infinity,j<n?nums2[j]:Infinity);\n      return (maxL+minR)/2;\n    }\n  }\n}`,
      python: `def find_median_sorted_arrays(nums1, nums2):\n    if len(nums1)>len(nums2): return find_median_sorted_arrays(nums2,nums1)\n    m,n=len(nums1),len(nums2); half=(m+n+1)//2\n    lo,hi=0,m\n    while lo<=hi:\n        i=(lo+hi)//2; j=half-i\n        if i<m and nums1[i]<nums2[j-1]: lo=i+1\n        elif i>0 and nums1[i-1]>nums2[j]: hi=i-1\n        else:\n            max_l=max(nums1[i-1] if i>0 else float('-inf'), nums2[j-1] if j>0 else float('-inf'))\n            if (m+n)%2: return max_l\n            min_r=min(nums1[i] if i<m else float('inf'), nums2[j] if j<n else float('inf'))\n            return (max_l+min_r)/2`,
      cpp: `double findMedianSortedArrays(vector<int>& a, vector<int>& b) {\n    if(a.size()>b.size()) return findMedianSortedArrays(b,a);\n    int m=a.size(),n=b.size(),half=(m+n+1)/2,lo=0,hi=m;\n    while(lo<=hi){int i=(lo+hi)/2,j=half-i;\n        if(i<m&&a[i]<b[j-1])lo=i+1;\n        else if(i>0&&a[i-1]>b[j])hi=i-1;\n        else{int ml=max(i>0?a[i-1]:INT_MIN,j>0?b[j-1]:INT_MIN);\n            if((m+n)%2)return ml;\n            int mr=min(i<m?a[i]:INT_MAX,j<n?b[j]:INT_MAX);\n            return(ml+mr)/2.0;}}\n    return 0;\n}`,
      java: `public double findMedianSortedArrays(int[] a, int[] b) {\n    if(a.length>b.length) return findMedianSortedArrays(b,a);\n    int m=a.length,n=b.length,half=(m+n+1)/2,lo=0,hi=m;\n    while(lo<=hi){int i=(lo+hi)/2,j=half-i;\n        if(i<m&&a[i]<b[j-1])lo=i+1;\n        else if(i>0&&a[i-1]>b[j])hi=i-1;\n        else{int ml=Math.max(i>0?a[i-1]:Integer.MIN_VALUE,j>0?b[j-1]:Integer.MIN_VALUE);\n            if((m+n)%2==1)return ml;\n            int mr=Math.min(i<m?a[i]:Integer.MAX_VALUE,j<n?b[j]:Integer.MAX_VALUE);\n            return(ml+mr)/2.0;}}\n    return 0;\n}`
    }
  },
  {
    id: 'regular-expression-matching',
    title: 'Regular Expression Matching',
    topic: 'Dynamic Programming',
    difficulty: 'Hard',
    companiesAsked: ['Google', 'Meta', 'Goldman Sachs'],
    expectedTimeMinutes: 30,
    optimalComplexity: 'O(m×n) time, O(m×n) space',
    description: 'Implement regular expression matching with `.` (matches any single character) and `*` (matches zero or more of the preceding element). The matching must cover the entire input string.',
    examples: [
      { input: 's = "aa", p = "a*"', output: 'true', explanation: '"a*" means zero or more "a", which matches "aa".' },
      { input: 's = "ab", p = ".*"', output: 'true', explanation: '".*" matches any sequence.' }
    ],
    testCases: [
      { input: 's = "aa", p = "a*"', expectedOutput: 'true', hidden: false },
      { input: 's = "mississippi", p = "mis*is*p*."', expectedOutput: 'false', hidden: true }
    ],
    companyNotes: {
      Google: `Top 5 hardest DP problems at Google. Walk through the recurrence clearly for `*` case: it can represent 0 occurrences (skip pair) or 1+ occurrences.`,
      'Goldman Sachs': `"Financial pattern matching for transaction code validation uses similar regex-DP techniques."`
    },
    starterCode: {
      javascript: `function isMatch(s, p) {\n  const m=s.length, n=p.length;\n  const dp=Array.from({length:m+1},()=>new Array(n+1).fill(false));\n  dp[0][0]=true;\n  for(let j=1;j<=n;j++) if(p[j-1]==='*') dp[0][j]=dp[0][j-2];\n  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++){\n    if(p[j-1]==='*') dp[i][j]=dp[i][j-2]||(p[j-2]==='.'||p[j-2]===s[i-1])&&dp[i-1][j];\n    else dp[i][j]=(p[j-1]==='.'||p[j-1]===s[i-1])&&dp[i-1][j-1];\n  }\n  return dp[m][n];\n}`,
      python: `def is_match(s, p):\n    m,n=len(s),len(p)\n    dp=[[False]*(n+1) for _ in range(m+1)]\n    dp[0][0]=True\n    for j in range(1,n+1):\n        if p[j-1]=='*': dp[0][j]=dp[0][j-2]\n    for i in range(1,m+1):\n        for j in range(1,n+1):\n            if p[j-1]=='*': dp[i][j]=dp[i][j-2] or (p[j-2] in {'.', s[i-1]}) and dp[i-1][j]\n            else: dp[i][j]=(p[j-1]=='.' or p[j-1]==s[i-1]) and dp[i-1][j-1]\n    return dp[m][n]`,
      cpp: `bool isMatch(string s, string p) {\n    int m=s.size(),n=p.size(); vector<vector<bool>> dp(m+1,vector<bool>(n+1,false));\n    dp[0][0]=true;\n    for(int j=1;j<=n;j++) if(p[j-1]=='*') dp[0][j]=dp[0][j-2];\n    for(int i=1;i<=m;i++) for(int j=1;j<=n;j++){\n        if(p[j-1]=='*') dp[i][j]=dp[i][j-2]||((p[j-2]=='.'||p[j-2]==s[i-1])&&dp[i-1][j]);\n        else dp[i][j]=(p[j-1]=='.'||p[j-1]==s[i-1])&&dp[i-1][j-1];\n    }\n    return dp[m][n];\n}`,
      java: `public boolean isMatch(String s, String p) {\n    int m=s.length(),n=p.length(); boolean[][] dp=new boolean[m+1][n+1];\n    dp[0][0]=true;\n    for(int j=1;j<=n;j++) if(p.charAt(j-1)=='*') dp[0][j]=dp[0][j-2];\n    for(int i=1;i<=m;i++) for(int j=1;j<=n;j++){\n        if(p.charAt(j-1)=='*') dp[i][j]=dp[i][j-2]||((p.charAt(j-2)=='.'||p.charAt(j-2)==s.charAt(i-1))&&dp[i-1][j]);\n        else dp[i][j]=(p.charAt(j-1)=='.'||p.charAt(j-1)==s.charAt(i-1))&&dp[i-1][j-1];\n    }\n    return dp[m][n];\n}`
    }
  },
  {
    id: 'sliding-window-maximum',
    title: 'Sliding Window Maximum',
    topic: 'Sliding Window',
    difficulty: 'Hard',
    companiesAsked: ['Google', 'Amazon', 'Uber', 'Meta'],
    expectedTimeMinutes: 25,
    optimalComplexity: 'O(n) time, O(k) space (monotonic deque)',
    description: 'Given an integer array `nums` and an integer `k`, return an array of the maximum values in each sliding window of size `k`.',
    examples: [
      { input: 'nums = [1,3,-1,-3,5,3,6,7], k = 3', output: '[3,3,5,5,6,7]', explanation: 'Max in each window of size 3.' }
    ],
    testCases: [
      { input: 'nums = [1,3,-1,-3,5,3,6,7], k = 3', expectedOutput: '[3,3,5,5,6,7]', hidden: false },
      { input: 'nums = [1], k = 1', expectedOutput: '[1]', hidden: true }
    ],
    companyNotes: {
      Google: `"Can you explain why the deque maintains a decreasing monotonic invariant and prove no element is processed more than twice?"`,
      Amazon: `"This is used in time-series peak detection for CloudWatch metric anomaly detection."`,
      Uber: `"Real-time maximum surge pricing window — same pattern as this algorithm."`
    },
    starterCode: {
      javascript: `function maxSlidingWindow(nums, k) {\n  const deq = [], res = [];\n  for (let i = 0; i < nums.length; i++) {\n    if (deq.length && deq[0] < i-k+1) deq.shift();\n    while (deq.length && nums[deq[deq.length-1]] < nums[i]) deq.pop();\n    deq.push(i);\n    if (i >= k-1) res.push(nums[deq[0]]);\n  }\n  return res;\n}`,
      python: `from collections import deque\ndef max_sliding_window(nums, k):\n    dq=deque(); res=[]\n    for i,n in enumerate(nums):\n        if dq and dq[0]<i-k+1: dq.popleft()\n        while dq and nums[dq[-1]]<n: dq.pop()\n        dq.append(i)\n        if i>=k-1: res.append(nums[dq[0]])\n    return res`,
      cpp: `vector<int> maxSlidingWindow(vector<int>& nums, int k) {\n    deque<int> dq; vector<int> res;\n    for(int i=0;i<nums.size();i++){\n        if(!dq.empty()&&dq.front()<i-k+1) dq.pop_front();\n        while(!dq.empty()&&nums[dq.back()]<nums[i]) dq.pop_back();\n        dq.push_back(i);\n        if(i>=k-1) res.push_back(nums[dq.front()]);\n    }\n    return res;\n}`,
      java: `public int[] maxSlidingWindow(int[] nums, int k) {\n    Deque<Integer> dq=new ArrayDeque<>(); int[] res=new int[nums.length-k+1]; int ri=0;\n    for(int i=0;i<nums.length;i++){\n        if(!dq.isEmpty()&&dq.peekFirst()<i-k+1) dq.pollFirst();\n        while(!dq.isEmpty()&&nums[dq.peekLast()]<nums[i]) dq.pollLast();\n        dq.offerLast(i);\n        if(i>=k-1) res[ri++]=nums[dq.peekFirst()];\n    }\n    return res;\n}`
    }
  }
];

export const INITIAL_QUESTIONS = [
  ...EASY_QUESTIONS,
  ...MEDIUM_QUESTIONS,
  ...HARD_QUESTIONS
];

export async function seedQuestionsInFirestore() {
  try {
    const colRef = collection(db, 'questions');
    for (const q of INITIAL_QUESTIONS) {
      const docRef = doc(colRef, q.id);
      await setDoc(docRef, q);
    }
    console.log(`Successfully seeded ${INITIAL_QUESTIONS.length} questions in Firestore!`);
    return { success: true, count: INITIAL_QUESTIONS.length };
  } catch (error) {
    console.error('Error seeding questions in Firestore:', error);
    return { success: false, error: error.message };
  }
}
