# タスク011: パーサーアーキテクチャ設計

## 目的
BashスクリプトをASTに変換するパーサーのアーキテクチャを設計し、基本構造を実装する

## 前提条件
- Phase 3のタスクが完了している
- bash-parserパッケージがインストールされている

## 実装内容

### 1. パーサーインターフェースの定義
```typescript
// src/parser/types.ts
export interface BashAST {
  type: 'Script';
  commands: Command[];
}

export interface Command {
  type: 'Command' | 'Pipeline' | 'List' | 'Compound';
  name?: string;
  args?: string[];
  redirections?: Redirection[];
  next?: Command;
}

export interface Pipeline {
  type: 'Pipeline';
  commands: Command[];
}

export interface Conditional {
  type: 'If' | 'Case';
  condition: Expression;
  then: Command[];
  else?: Command[];
}

export interface Loop {
  type: 'For' | 'While' | 'Until';
  variable?: string;
  list?: string[];
  condition?: Expression;
  body: Command[];
}

export interface Variable {
  type: 'Assignment';
  name: string;
  value: string | Expression;
  export?: boolean;
}

export interface Expression {
  type: 'Binary' | 'Unary' | 'Literal' | 'Variable';
  operator?: string;
  left?: Expression;
  right?: Expression;
  value?: string | number | boolean;
  name?: string;
}

export interface Redirection {
  type: 'input' | 'output' | 'append' | 'heredoc';
  fd?: number;
  target: string;
}
```

### 2. パーサークラスの実装
```typescript
// src/parser/BashParser.ts
import * as bashParser from 'bash-parser';
import { BashAST, Command, Pipeline, Conditional, Loop, Variable } from './types';

export class BashParser {
  private source: string;
  private ast: any;

  constructor(source: string) {
    this.source = source;
  }

  parse(): BashAST {
    try {
      // Use bash-parser library to get raw AST
      this.ast = bashParser(this.source);
      
      // Transform to our AST format
      return this.transformAST(this.ast);
    } catch (error) {
      console.error('Parse error:', error);
      throw new Error(`Failed to parse Bash script: ${error.message}`);
    }
  }

  private transformAST(rawAST: any): BashAST {
    const commands = this.extractCommands(rawAST);
    
    return {
      type: 'Script',
      commands,
    };
  }

  private extractCommands(node: any): Command[] {
    const commands: Command[] = [];
    
    if (!node || !node.commands) {
      return commands;
    }

    for (const cmd of node.commands) {
      const command = this.transformCommand(cmd);
      if (command) {
        commands.push(command);
      }
    }

    return commands;
  }

  private transformCommand(node: any): Command | null {
    switch (node.type) {
      case 'Command':
        return this.transformSimpleCommand(node);
      case 'Pipeline':
        return this.transformPipeline(node);
      case 'If':
        return this.transformConditional(node);
      case 'For':
      case 'While':
      case 'Until':
        return this.transformLoop(node);
      case 'AssignmentWord':
        return this.transformVariable(node);
      default:
        console.warn(`Unknown command type: ${node.type}`);
        return null;
    }
  }

  private transformSimpleCommand(node: any): Command {
    return {
      type: 'Command',
      name: node.name?.text || '',
      args: node.suffix?.map((s: any) => s.text) || [],
      redirections: this.extractRedirections(node),
    };
  }

  private transformPipeline(node: any): Pipeline {
    return {
      type: 'Pipeline',
      commands: node.commands?.map((cmd: any) => this.transformCommand(cmd)) || [],
    };
  }

  private transformConditional(node: any): Conditional {
    return {
      type: 'If',
      condition: this.extractExpression(node.clause),
      then: this.extractCommands(node.then),
      else: node.else ? this.extractCommands(node.else) : undefined,
    };
  }

  private transformLoop(node: any): Loop {
    const loopType = node.type as 'For' | 'While' | 'Until';
    
    return {
      type: loopType,
      variable: node.name?.text,
      list: node.wordlist?.map((w: any) => w.text),
      condition: node.clause ? this.extractExpression(node.clause) : undefined,
      body: this.extractCommands(node.do),
    };
  }

  private transformVariable(node: any): Variable {
    const [name, value] = node.text.split('=');
    
    return {
      type: 'Assignment',
      name,
      value: value || '',
      export: false, // Will be determined by context
    };
  }

  private extractExpression(node: any): Expression {
    // Simplified expression extraction
    return {
      type: 'Literal',
      value: node?.text || '',
    };
  }

  private extractRedirections(node: any): Redirection[] {
    const redirections: Redirection[] = [];
    
    if (node.redirections) {
      for (const redir of node.redirections) {
        redirections.push({
          type: this.getRedirectionType(redir.op?.text),
          fd: redir.numberIo?.text ? parseInt(redir.numberIo.text) : undefined,
          target: redir.file?.text || '',
        });
      }
    }
    
    return redirections;
  }

  private getRedirectionType(op: string): Redirection['type'] {
    switch (op) {
      case '<':
        return 'input';
      case '>':
        return 'output';
      case '>>':
        return 'append';
      case '<<':
      case '<<<':
        return 'heredoc';
      default:
        return 'output';
    }
  }
}
```

### 3. パーサーのテストユーティリティ
```typescript
// src/parser/parserUtils.ts
import { BashParser } from './BashParser';
import { BashAST } from './types';

export function parseScript(script: string): BashAST {
  const parser = new BashParser(script);
  return parser.parse();
}

export function validateAST(ast: BashAST): boolean {
  // Basic validation
  if (!ast || ast.type !== 'Script') {
    return false;
  }
  
  if (!Array.isArray(ast.commands)) {
    return false;
  }
  
  // Additional validation rules
  for (const command of ast.commands) {
    if (!validateCommand(command)) {
      return false;
    }
  }
  
  return true;
}

function validateCommand(command: any): boolean {
  if (!command || !command.type) {
    return false;
  }
  
  switch (command.type) {
    case 'Command':
      return !!command.name;
    case 'Pipeline':
      return Array.isArray(command.commands) && command.commands.length > 0;
    case 'If':
      return !!command.condition && Array.isArray(command.then);
    case 'For':
    case 'While':
    case 'Until':
      return Array.isArray(command.body);
    case 'Assignment':
      return !!command.name && command.value !== undefined;
    default:
      return true;
  }
}
```

### 4. パーサーのエラーハンドリング
```typescript
// src/parser/errors.ts
export class ParseError extends Error {
  constructor(
    message: string,
    public line?: number,
    public column?: number,
    public source?: string
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public ast?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function handleParseError(error: any): ParseError {
  if (error instanceof ParseError) {
    return error;
  }
  
  // Extract line and column from bash-parser error if available
  const match = error.message?.match(/Line (\d+):(\d+)/);
  if (match) {
    return new ParseError(
      error.message,
      parseInt(match[1]),
      parseInt(match[2])
    );
  }
  
  return new ParseError(error.message || 'Unknown parse error');
}
```

## 成果物
- src/parser/types.ts
- src/parser/BashParser.ts
- src/parser/parserUtils.ts
- src/parser/errors.ts

## テスト方法
1. 簡単なBashスクリプトをパースできる
2. エラーが適切にハンドリングされる
3. ASTの構造が正しく生成される
4. バリデーションが正しく動作する

## 完了条件
- [ ] AST型定義が完了している
- [ ] BashParserクラスが実装されている
- [ ] パーサーユーティリティが実装されている
- [ ] エラーハンドリングが実装されている
- [ ] bash-parserライブラリとの統合が完了している