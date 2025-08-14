# タスク013: 基本構文パース

## 目的
基本的なBash構文（コマンド、パイプ、リダイレクト）のパース機能を実装する

## 前提条件
- タスク012が完了している
- AST定義が完成している

## 実装内容

### 1. 基本コマンドパーサー
```typescript
// src/parser/parsers/commandParser.ts
import { Command, Word, Variable, Redirection } from '../ast/types';
import { ASTBuilder } from '../ast/builder';

export class CommandParser {
  parseCommand(input: any): Command {
    const name = this.parseWord(input.name);
    const args = this.parseArguments(input.suffix);
    const assignments = this.parseAssignments(input.prefix);
    const redirections = this.parseRedirections(input.redirections);

    return {
      type: 'Command',
      name,
      args,
      assignments,
      redirections,
    };
  }

  private parseWord(input: any): Word {
    if (!input) {
      return ASTBuilder.word('');
    }

    if (typeof input === 'string') {
      return ASTBuilder.word(input);
    }

    const text = input.text || '';
    const expansions = this.parseExpansions(input.expansion);

    return {
      type: 'Word',
      text,
      expansion: expansions,
      quoted: this.getQuoteType(input),
    };
  }

  private parseArguments(suffix: any[]): Word[] {
    if (!suffix || !Array.isArray(suffix)) {
      return [];
    }

    return suffix.map(arg => this.parseWord(arg));
  }

  private parseAssignments(prefix: any[]): Variable[] | undefined {
    if (!prefix || !Array.isArray(prefix)) {
      return undefined;
    }

    const assignments: Variable[] = [];
    
    for (const item of prefix) {
      if (item.type === 'AssignmentWord') {
        const [name, value] = item.text.split('=');
        assignments.push({
          type: 'Assignment',
          name,
          value: ASTBuilder.word(value || ''),
        });
      }
    }

    return assignments.length > 0 ? assignments : undefined;
  }

  private parseRedirections(redirections: any[]): Redirection[] | undefined {
    if (!redirections || !Array.isArray(redirections)) {
      return undefined;
    }

    const parsed: Redirection[] = [];

    for (const redir of redirections) {
      parsed.push({
        type: 'Redirection',
        kind: this.getRedirectionKind(redir.op),
        fd: redir.numberIo ? parseInt(redir.numberIo.text) : undefined,
        target: this.parseWord(redir.file),
      });
    }

    return parsed.length > 0 ? parsed : undefined;
  }

  private parseExpansions(expansions: any[]): any[] {
    if (!expansions || !Array.isArray(expansions)) {
      return [];
    }

    return expansions.map(exp => {
      switch (exp.type) {
        case 'ParameterExpansion':
          return {
            type: 'Expansion',
            kind: 'Parameter',
            parameter: exp.parameter,
            modifier: exp.modifier,
          };
        case 'CommandSubstitution':
          return {
            type: 'Expansion',
            kind: 'Command',
            command: this.parseCommand(exp.command),
          };
        case 'ArithmeticExpansion':
          return {
            type: 'Expansion',
            kind: 'Arithmetic',
            expression: exp.expression,
          };
        default:
          return exp;
      }
    });
  }

  private getQuoteType(input: any): Word['quoted'] {
    if (input.singleQuoted) return 'single';
    if (input.doubleQuoted) return 'double';
    return 'none';
  }

  private getRedirectionKind(op: string): Redirection['kind'] {
    switch (op) {
      case '<': return 'input';
      case '>': return 'output';
      case '>>': return 'append';
      case '<<': return 'heredoc';
      case '<<<': return 'herestring';
      case '>&': return 'duplicating';
      default: return 'output';
    }
  }
}
```

### 2. パイプラインパーサー
```typescript
// src/parser/parsers/pipelineParser.ts
import { Pipeline, Command } from '../ast/types';
import { CommandParser } from './commandParser';

export class PipelineParser {
  private commandParser: CommandParser;

  constructor() {
    this.commandParser = new CommandParser();
  }

  parsePipeline(input: any): Pipeline {
    const commands = this.parseCommands(input.commands);
    const negated = input.negated || false;

    return {
      type: 'Pipeline',
      commands,
      negated,
    };
  }

  private parseCommands(commands: any[]): Command[] {
    if (!commands || !Array.isArray(commands)) {
      return [];
    }

    return commands.map(cmd => {
      if (cmd.type === 'Command') {
        return this.commandParser.parseCommand(cmd);
      }
      // Handle nested structures
      return this.parseNestedCommand(cmd);
    });
  }

  private parseNestedCommand(cmd: any): Command {
    // Simplified for basic commands
    return this.commandParser.parseCommand(cmd);
  }
}
```

### 3. リストパーサー
```typescript
// src/parser/parsers/listParser.ts
import { List, Statement } from '../ast/types';
import { StatementParser } from './statementParser';

export class ListParser {
  private statementParser: StatementParser;

  constructor(statementParser: StatementParser) {
    this.statementParser = statementParser;
  }

  parseList(input: any): List {
    const operator = this.getOperator(input.op);
    const left = this.statementParser.parseStatement(input.left);
    const right = this.statementParser.parseStatement(input.right);

    return {
      type: 'List',
      operator,
      left,
      right,
    };
  }

  private getOperator(op: string): List['operator'] {
    switch (op) {
      case '&&': return '&&';
      case '||': return '||';
      case ';': return ';';
      case '&': return '&';
      default: return ';';
    }
  }
}
```

### 4. ステートメントパーサー
```typescript
// src/parser/parsers/statementParser.ts
import { Statement, Command, Pipeline, List } from '../ast/types';
import { CommandParser } from './commandParser';
import { PipelineParser } from './pipelineParser';
import { ListParser } from './listParser';

export class StatementParser {
  private commandParser: CommandParser;
  private pipelineParser: PipelineParser;
  private listParser: ListParser;

  constructor() {
    this.commandParser = new CommandParser();
    this.pipelineParser = new PipelineParser();
    this.listParser = new ListParser(this);
  }

  parseStatement(input: any): Statement {
    const node = this.parseNode(input);
    const background = input.async || false;

    return {
      type: 'Statement',
      node,
      background,
    };
  }

  private parseNode(input: any): Statement['node'] {
    switch (input.type) {
      case 'Command':
        return this.commandParser.parseCommand(input);
      case 'Pipeline':
        return this.pipelineParser.parsePipeline(input);
      case 'LogicalExpression':
      case 'List':
        return this.listParser.parseList(input);
      default:
        // Fallback to command
        return this.commandParser.parseCommand(input);
    }
  }
}
```

### 5. メインパーサーの更新
```typescript
// src/parser/BashScriptParser.ts
import * as bashParser from 'bash-parser';
import { Script, Statement } from './ast/types';
import { StatementParser } from './parsers/statementParser';
import { ParseError, handleParseError } from './errors';

export class BashScriptParser {
  private statementParser: StatementParser;

  constructor() {
    this.statementParser = new StatementParser();
  }

  parse(source: string): Script {
    try {
      // Parse with bash-parser
      const rawAST = bashParser(source, {
        mode: 'bash',
        insertLOC: true,
      });

      // Extract shebang if present
      const shebang = this.extractShebang(source);

      // Parse statements
      const body = this.parseBody(rawAST);

      return {
        type: 'Script',
        body,
        shebang,
      };
    } catch (error) {
      throw handleParseError(error);
    }
  }

  private extractShebang(source: string): string | undefined {
    const lines = source.split('\n');
    if (lines[0] && lines[0].startsWith('#!')) {
      return lines[0];
    }
    return undefined;
  }

  private parseBody(rawAST: any): Statement[] {
    const statements: Statement[] = [];

    if (!rawAST.commands) {
      return statements;
    }

    for (const cmd of rawAST.commands) {
      try {
        const statement = this.statementParser.parseStatement(cmd);
        statements.push(statement);
      } catch (error) {
        console.warn('Failed to parse statement:', error);
        // Continue parsing other statements
      }
    }

    return statements;
  }
}
```

### 6. パーサーのテスト例
```typescript
// src/parser/tests/basicParsing.test.ts
import { BashScriptParser } from '../BashScriptParser';

describe('Basic Parsing', () => {
  const parser = new BashScriptParser();

  test('parse simple command', () => {
    const script = 'echo "Hello World"';
    const ast = parser.parse(script);
    
    expect(ast.type).toBe('Script');
    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].node.type).toBe('Command');
    expect(ast.body[0].node.name.text).toBe('echo');
  });

  test('parse pipeline', () => {
    const script = 'ls -la | grep txt';
    const ast = parser.parse(script);
    
    expect(ast.body[0].node.type).toBe('Pipeline');
    expect(ast.body[0].node.commands).toHaveLength(2);
  });

  test('parse redirection', () => {
    const script = 'echo "test" > output.txt';
    const ast = parser.parse(script);
    
    const command = ast.body[0].node;
    expect(command.redirections).toHaveLength(1);
    expect(command.redirections[0].kind).toBe('output');
    expect(command.redirections[0].target.text).toBe('output.txt');
  });

  test('parse list', () => {
    const script = 'mkdir test && cd test';
    const ast = parser.parse(script);
    
    expect(ast.body[0].node.type).toBe('List');
    expect(ast.body[0].node.operator).toBe('&&');
  });

  test('parse background command', () => {
    const script = 'sleep 10 &';
    const ast = parser.parse(script);
    
    expect(ast.body[0].background).toBe(true);
  });
});
```

## 成果物
- src/parser/parsers/commandParser.ts
- src/parser/parsers/pipelineParser.ts
- src/parser/parsers/listParser.ts
- src/parser/parsers/statementParser.ts
- src/parser/BashScriptParser.ts
- src/parser/tests/basicParsing.test.ts

## テスト方法
1. 単純なコマンドが正しくパースされる
2. パイプラインが正しくパースされる
3. リダイレクトが正しくパースされる
4. リスト（&&, ||, ;）が正しくパースされる
5. バックグラウンドコマンドが認識される

## 完了条件
- [ ] コマンドパーサーが実装されている
- [ ] パイプラインパーサーが実装されている
- [ ] リストパーサーが実装されている
- [ ] リダイレクトが正しくパースされる
- [ ] 基本的なテストが通る