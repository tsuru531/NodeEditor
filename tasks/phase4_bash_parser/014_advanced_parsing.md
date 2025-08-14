# タスク014: 高度な構文パース

## 目的
条件分岐、ループ、関数定義などの高度なBash構文のパース機能を実装する

## 前提条件
- タスク013が完了している
- 基本構文のパースが動作している

## 実装内容

### 1. 条件分岐パーサー
```typescript
// src/parser/parsers/conditionalParser.ts
import { Conditional, Statement, Expression, Command } from '../ast/types';
import { StatementParser } from './statementParser';
import { ExpressionParser } from './expressionParser';

export class ConditionalParser {
  private statementParser: StatementParser;
  private expressionParser: ExpressionParser;

  constructor(statementParser: StatementParser) {
    this.statementParser = statementParser;
    this.expressionParser = new ExpressionParser();
  }

  parseIf(input: any): Conditional {
    const condition = this.parseCondition(input.clause);
    const then = this.parseStatements(input.then);
    const elif = this.parseElif(input.elif);
    const elseStatements = this.parseElse(input.else);

    return {
      type: 'If',
      condition,
      then,
      elif,
      else: elseStatements,
    };
  }

  private parseCondition(clause: any): Expression | Command {
    if (!clause) {
      throw new Error('If statement must have a condition');
    }

    // Check if it's a test expression [[ ... ]] or [ ... ]
    if (clause.type === 'TestExpression') {
      return this.expressionParser.parseTestExpression(clause);
    }

    // Otherwise, it's a command (like `if grep ...`)
    return this.statementParser.parseCommand(clause);
  }

  private parseStatements(statements: any[]): Statement[] {
    if (!statements || !Array.isArray(statements)) {
      return [];
    }

    return statements.map(stmt => this.statementParser.parseStatement(stmt));
  }

  private parseElif(elifClauses: any[]): Conditional[] | undefined {
    if (!elifClauses || !Array.isArray(elifClauses)) {
      return undefined;
    }

    return elifClauses.map(elif => ({
      type: 'Elif',
      condition: this.parseCondition(elif.clause),
      then: this.parseStatements(elif.then),
    }));
  }

  private parseElse(elseClause: any): Statement[] | undefined {
    if (!elseClause) {
      return undefined;
    }

    return this.parseStatements(elseClause.commands);
  }
}
```

### 2. ループパーサー
```typescript
// src/parser/parsers/loopParser.ts
import { Loop, Statement, Word, Expression, Command } from '../ast/types';
import { StatementParser } from './statementParser';
import { WordParser } from './wordParser';

export class LoopParser {
  private statementParser: StatementParser;
  private wordParser: WordParser;

  constructor(statementParser: StatementParser) {
    this.statementParser = statementParser;
    this.wordParser = new WordParser();
  }

  parseFor(input: any): Loop {
    const variable = input.name?.text;
    const list = this.parseWordList(input.wordlist);
    const body = this.parseBody(input.do);

    return {
      type: 'For',
      variable,
      list,
      body,
    };
  }

  parseWhile(input: any): Loop {
    const condition = this.parseLoopCondition(input.clause);
    const body = this.parseBody(input.do);

    return {
      type: 'While',
      condition,
      body,
    };
  }

  parseUntil(input: any): Loop {
    const condition = this.parseLoopCondition(input.clause);
    const body = this.parseBody(input.do);

    return {
      type: 'Until',
      condition,
      body,
    };
  }

  parseSelect(input: any): Loop {
    const variable = input.name?.text;
    const list = this.parseWordList(input.wordlist);
    const body = this.parseBody(input.do);

    return {
      type: 'Select',
      variable,
      list,
      body,
    };
  }

  private parseWordList(wordlist: any[]): Word[] {
    if (!wordlist || !Array.isArray(wordlist)) {
      return [];
    }

    return wordlist.map(word => this.wordParser.parseWord(word));
  }

  private parseLoopCondition(clause: any): Expression | Command {
    if (!clause) {
      throw new Error('Loop must have a condition');
    }

    // Parse as command or expression
    return this.statementParser.parseCommand(clause);
  }

  private parseBody(body: any): Statement[] {
    if (!body || !body.commands) {
      return [];
    }

    return body.commands.map((cmd: any) => 
      this.statementParser.parseStatement(cmd)
    );
  }
}
```

### 3. 関数定義パーサー
```typescript
// src/parser/parsers/functionParser.ts
import { FunctionDef, Statement } from '../ast/types';
import { StatementParser } from './statementParser';

export class FunctionParser {
  private statementParser: StatementParser;

  constructor(statementParser: StatementParser) {
    this.statementParser = statementParser;
  }

  parseFunction(input: any): FunctionDef {
    const name = this.parseFunctionName(input);
    const body = this.parseFunctionBody(input.body);

    return {
      type: 'Function',
      name,
      body,
    };
  }

  private parseFunctionName(input: any): string {
    if (input.name?.text) {
      return input.name.text;
    }

    // Handle different function declaration styles
    if (input.functionName) {
      return input.functionName;
    }

    throw new Error('Function must have a name');
  }

  private parseFunctionBody(body: any): Statement[] {
    if (!body) {
      return [];
    }

    // Function body might be a compound command
    if (body.type === 'CompoundList') {
      return this.parseCompoundList(body);
    }

    // Or a single command
    if (body.type === 'Command') {
      return [this.statementParser.parseStatement(body)];
    }

    // Or a list of commands
    if (body.commands) {
      return body.commands.map((cmd: any) => 
        this.statementParser.parseStatement(cmd)
      );
    }

    return [];
  }

  private parseCompoundList(compound: any): Statement[] {
    if (!compound.commands) {
      return [];
    }

    return compound.commands.map((cmd: any) => 
      this.statementParser.parseStatement(cmd)
    );
  }
}
```

### 4. Case文パーサー
```typescript
// src/parser/parsers/caseParser.ts
import { CaseStatement, CaseItem, Word, Statement } from '../ast/types';
import { WordParser } from './wordParser';
import { StatementParser } from './statementParser';

export class CaseParser {
  private wordParser: WordParser;
  private statementParser: StatementParser;

  constructor(statementParser: StatementParser) {
    this.statementParser = statementParser;
    this.wordParser = new WordParser();
  }

  parseCase(input: any): CaseStatement {
    const word = this.wordParser.parseWord(input.word);
    const cases = this.parseCaseItems(input.cases);

    return {
      type: 'Case',
      word,
      cases,
    };
  }

  private parseCaseItems(items: any[]): CaseItem[] {
    if (!items || !Array.isArray(items)) {
      return [];
    }

    return items.map(item => this.parseCaseItem(item));
  }

  private parseCaseItem(item: any): CaseItem {
    const patterns = this.parsePatterns(item.pattern);
    const body = this.parseBody(item.body);
    const terminator = this.parseTerminator(item.terminator);

    return {
      patterns,
      body,
      terminator,
    };
  }

  private parsePatterns(patterns: any): Word[] {
    if (!patterns) {
      return [];
    }

    if (Array.isArray(patterns)) {
      return patterns.map(p => this.wordParser.parseWord(p));
    }

    return [this.wordParser.parseWord(patterns)];
  }

  private parseBody(body: any): Statement[] {
    if (!body || !body.commands) {
      return [];
    }

    return body.commands.map((cmd: any) => 
      this.statementParser.parseStatement(cmd)
    );
  }

  private parseTerminator(terminator: string): CaseItem['terminator'] {
    switch (terminator) {
      case ';;':
      case ';&':
      case ';;&':
        return terminator;
      default:
        return ';;';
    }
  }
}
```

### 5. 式パーサー
```typescript
// src/parser/parsers/expressionParser.ts
import { Expression, Word } from '../ast/types';
import { WordParser } from './wordParser';

export class ExpressionParser {
  private wordParser: WordParser;

  constructor() {
    this.wordParser = new WordParser();
  }

  parseExpression(input: any): Expression {
    switch (input.type) {
      case 'BinaryExpression':
        return this.parseBinaryExpression(input);
      case 'UnaryExpression':
        return this.parseUnaryExpression(input);
      case 'TestExpression':
        return this.parseTestExpression(input);
      case 'ArithmeticExpression':
        return this.parseArithmeticExpression(input);
      default:
        return this.parseLiteralExpression(input);
    }
  }

  parseBinaryExpression(input: any): Expression {
    return {
      type: 'Expression',
      kind: 'Binary',
      operator: input.operator,
      left: this.parseOperand(input.left),
      right: this.parseOperand(input.right),
    };
  }

  parseUnaryExpression(input: any): Expression {
    return {
      type: 'Expression',
      kind: 'Unary',
      operator: input.operator,
      operand: this.parseOperand(input.operand),
    };
  }

  parseTestExpression(input: any): Expression {
    // Handle [[ ... ]] and [ ... ] expressions
    return {
      type: 'Expression',
      kind: 'Test',
      operator: input.operator || 'test',
      left: input.left ? this.parseOperand(input.left) : undefined,
      right: input.right ? this.parseOperand(input.right) : undefined,
    };
  }

  parseArithmeticExpression(input: any): Expression {
    return {
      type: 'Expression',
      kind: 'Arithmetic',
      operator: input.operator,
      left: input.left ? this.parseOperand(input.left) : undefined,
      right: input.right ? this.parseOperand(input.right) : undefined,
    };
  }

  private parseLiteralExpression(input: any): Expression {
    const value = this.extractValue(input);
    
    return {
      type: 'Expression',
      kind: 'Binary',
      operator: '==',
      left: value,
    };
  }

  private parseOperand(operand: any): Expression | Word {
    if (!operand) {
      return this.wordParser.parseWord('');
    }

    if (operand.type === 'Word') {
      return this.wordParser.parseWord(operand);
    }

    if (this.isExpression(operand)) {
      return this.parseExpression(operand);
    }

    return this.wordParser.parseWord(operand);
  }

  private isExpression(input: any): boolean {
    return input.type && (
      input.type.includes('Expression') ||
      input.type === 'BinaryOp' ||
      input.type === 'UnaryOp'
    );
  }

  private extractValue(input: any): Word {
    if (typeof input === 'string') {
      return this.wordParser.parseWord(input);
    }

    if (input.text) {
      return this.wordParser.parseWord(input.text);
    }

    return this.wordParser.parseWord('');
  }
}
```

### 6. 統合パーサーの更新
```typescript
// src/parser/parsers/statementParser.ts (更新)
import { ConditionalParser } from './conditionalParser';
import { LoopParser } from './loopParser';
import { FunctionParser } from './functionParser';
import { CaseParser } from './caseParser';

export class StatementParser {
  // ... existing code ...
  private conditionalParser: ConditionalParser;
  private loopParser: LoopParser;
  private functionParser: FunctionParser;
  private caseParser: CaseParser;

  constructor() {
    // ... existing initialization ...
    this.conditionalParser = new ConditionalParser(this);
    this.loopParser = new LoopParser(this);
    this.functionParser = new FunctionParser(this);
    this.caseParser = new CaseParser(this);
  }

  private parseNode(input: any): Statement['node'] {
    switch (input.type) {
      // ... existing cases ...
      case 'If':
        return this.conditionalParser.parseIf(input);
      case 'For':
        return this.loopParser.parseFor(input);
      case 'While':
        return this.loopParser.parseWhile(input);
      case 'Until':
        return this.loopParser.parseUntil(input);
      case 'Select':
        return this.loopParser.parseSelect(input);
      case 'Function':
        return this.functionParser.parseFunction(input);
      case 'Case':
        return this.caseParser.parseCase(input);
      default:
        return this.commandParser.parseCommand(input);
    }
  }
}
```

## 成果物
- src/parser/parsers/conditionalParser.ts
- src/parser/parsers/loopParser.ts
- src/parser/parsers/functionParser.ts
- src/parser/parsers/caseParser.ts
- src/parser/parsers/expressionParser.ts
- 更新されたstatementParser.ts

## テスト方法
1. if/elif/else文が正しくパースされる
2. for/while/untilループが正しくパースされる
3. 関数定義が正しくパースされる
4. case文が正しくパースされる
5. 複雑な式が正しくパースされる

## 完了条件
- [ ] 条件分岐パーサーが実装されている
- [ ] ループパーサーが実装されている
- [ ] 関数定義パーサーが実装されている
- [ ] case文パーサーが実装されている
- [ ] 式パーサーが実装されている
- [ ] 全ての高度な構文がパースできる