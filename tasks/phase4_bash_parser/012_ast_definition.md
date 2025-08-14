# タスク012: AST定義

## 目的
Bashスクリプトの全ての構文要素を表現できる完全なAST（抽象構文木）定義を作成する

## 前提条件
- タスク011が完了している
- 基本的なAST構造が定義されている

## 実装内容

### 1. 完全なAST型定義
```typescript
// src/parser/ast/types.ts
export type ASTNode = 
  | Script
  | Command
  | Pipeline
  | List
  | Conditional
  | Loop
  | FunctionDef
  | Variable
  | Expression
  | Redirection
  | SubShell
  | CaseStatement;

export interface Script {
  type: 'Script';
  body: Statement[];
  shebang?: string;
}

export interface Statement {
  type: 'Statement';
  node: Command | Pipeline | List | Conditional | Loop | FunctionDef | Variable;
  background?: boolean;
}

export interface Command {
  type: 'Command';
  name: Word;
  args: Word[];
  assignments?: Variable[];
  redirections?: Redirection[];
  environment?: Variable[];
}

export interface Pipeline {
  type: 'Pipeline';
  commands: Command[];
  negated?: boolean;
}

export interface List {
  type: 'List';
  operator: '&&' | '||' | ';' | '&';
  left: Statement;
  right: Statement;
}

export interface Conditional {
  type: 'If' | 'Elif' | 'Else';
  condition?: Expression | Command;
  then: Statement[];
  elif?: Conditional[];
  else?: Statement[];
}

export interface Loop {
  type: 'For' | 'While' | 'Until' | 'Select';
  variable?: string;
  list?: Word[];
  condition?: Expression | Command;
  body: Statement[];
}

export interface FunctionDef {
  type: 'Function';
  name: string;
  body: Statement[];
}

export interface Variable {
  type: 'Assignment';
  name: string;
  value: Word | Expression;
  operator?: '=' | '+=' | '-=' | '*=' | '/=' | '%=' | '<<=' | '>>=' | '&=' | '^=' | '|=';
  export?: boolean;
  readonly?: boolean;
  local?: boolean;
  array?: boolean;
  index?: Expression;
}

export interface Expression {
  type: 'Expression';
  kind: 'Binary' | 'Unary' | 'Ternary' | 'Arithmetic' | 'Test';
  operator?: string;
  left?: Expression | Word;
  right?: Expression | Word;
  condition?: Expression;
  trueExpr?: Expression;
  falseExpr?: Expression;
  operand?: Expression | Word;
}

export interface Word {
  type: 'Word';
  text: string;
  expansion?: Expansion[];
  quoted?: 'single' | 'double' | 'none';
}

export interface Expansion {
  type: 'Expansion';
  kind: 'Parameter' | 'Command' | 'Arithmetic' | 'Brace' | 'Tilde' | 'Glob';
  parameter?: string;
  command?: Command;
  expression?: Expression;
  pattern?: string;
  modifier?: string;
  default?: Word;
  alternative?: Word;
}

export interface Redirection {
  type: 'Redirection';
  kind: 'input' | 'output' | 'append' | 'heredoc' | 'herestring' | 'duplicating';
  fd?: number;
  target: Word | number;
  delimiter?: string;
  stripTabs?: boolean;
}

export interface SubShell {
  type: 'SubShell';
  body: Statement[];
}

export interface CaseStatement {
  type: 'Case';
  word: Word;
  cases: CaseItem[];
}

export interface CaseItem {
  patterns: Word[];
  body: Statement[];
  terminator?: ';;' | ';&' | ';;&';
}
```

### 2. AST ビルダーヘルパー
```typescript
// src/parser/ast/builder.ts
import * as AST from './types';

export class ASTBuilder {
  static script(body: AST.Statement[], shebang?: string): AST.Script {
    return {
      type: 'Script',
      body,
      shebang,
    };
  }

  static command(
    name: string | AST.Word,
    args: (string | AST.Word)[] = []
  ): AST.Command {
    return {
      type: 'Command',
      name: typeof name === 'string' ? this.word(name) : name,
      args: args.map(arg => typeof arg === 'string' ? this.word(arg) : arg),
    };
  }

  static pipeline(commands: AST.Command[], negated = false): AST.Pipeline {
    return {
      type: 'Pipeline',
      commands,
      negated,
    };
  }

  static list(
    operator: AST.List['operator'],
    left: AST.Statement,
    right: AST.Statement
  ): AST.List {
    return {
      type: 'List',
      operator,
      left,
      right,
    };
  }

  static ifStatement(
    condition: AST.Expression | AST.Command,
    then: AST.Statement[],
    elseStatements?: AST.Statement[]
  ): AST.Conditional {
    return {
      type: 'If',
      condition,
      then,
      else: elseStatements,
    };
  }

  static forLoop(
    variable: string,
    list: AST.Word[],
    body: AST.Statement[]
  ): AST.Loop {
    return {
      type: 'For',
      variable,
      list,
      body,
    };
  }

  static whileLoop(
    condition: AST.Expression | AST.Command,
    body: AST.Statement[]
  ): AST.Loop {
    return {
      type: 'While',
      condition,
      body,
    };
  }

  static function(name: string, body: AST.Statement[]): AST.FunctionDef {
    return {
      type: 'Function',
      name,
      body,
    };
  }

  static assignment(
    name: string,
    value: string | AST.Word | AST.Expression,
    options: Partial<AST.Variable> = {}
  ): AST.Variable {
    return {
      type: 'Assignment',
      name,
      value: typeof value === 'string' ? this.word(value) : value,
      ...options,
    };
  }

  static word(text: string, quoted?: AST.Word['quoted']): AST.Word {
    return {
      type: 'Word',
      text,
      quoted: quoted || 'none',
    };
  }

  static expansion(
    kind: AST.Expansion['kind'],
    options: Partial<AST.Expansion> = {}
  ): AST.Expansion {
    return {
      type: 'Expansion',
      kind,
      ...options,
    };
  }

  static redirection(
    kind: AST.Redirection['kind'],
    target: string | AST.Word | number,
    fd?: number
  ): AST.Redirection {
    return {
      type: 'Redirection',
      kind,
      target: typeof target === 'string' ? this.word(target) : target,
      fd,
    };
  }

  static statement(
    node: AST.Statement['node'],
    background = false
  ): AST.Statement {
    return {
      type: 'Statement',
      node,
      background,
    };
  }
}
```

### 3. AST トラバーサル
```typescript
// src/parser/ast/traversal.ts
import * as AST from './types';

export type Visitor = {
  [K in AST.ASTNode['type']]?: (node: Extract<AST.ASTNode, { type: K }>) => void;
};

export class ASTTraverser {
  private visitor: Visitor;

  constructor(visitor: Visitor) {
    this.visitor = visitor;
  }

  traverse(node: AST.ASTNode): void {
    const handler = this.visitor[node.type];
    if (handler) {
      handler(node as any);
    }

    this.traverseChildren(node);
  }

  private traverseChildren(node: AST.ASTNode): void {
    switch (node.type) {
      case 'Script':
        node.body.forEach(stmt => this.traverseStatement(stmt));
        break;
      case 'Pipeline':
        node.commands.forEach(cmd => this.traverse(cmd));
        break;
      case 'List':
        this.traverseStatement(node.left);
        this.traverseStatement(node.right);
        break;
      case 'If':
        if (node.condition) {
          this.traverseCondition(node.condition);
        }
        node.then.forEach(stmt => this.traverseStatement(stmt));
        if (node.elif) {
          node.elif.forEach(elif => this.traverse(elif));
        }
        if (node.else) {
          node.else.forEach(stmt => this.traverseStatement(stmt));
        }
        break;
      case 'For':
      case 'While':
      case 'Until':
        if (node.condition) {
          this.traverseCondition(node.condition);
        }
        node.body.forEach(stmt => this.traverseStatement(stmt));
        break;
      case 'Function':
        node.body.forEach(stmt => this.traverseStatement(stmt));
        break;
      case 'Case':
        this.traverseWord(node.word);
        node.cases.forEach(caseItem => {
          caseItem.patterns.forEach(pattern => this.traverseWord(pattern));
          caseItem.body.forEach(stmt => this.traverseStatement(stmt));
        });
        break;
    }
  }

  private traverseStatement(stmt: AST.Statement): void {
    if (stmt.node) {
      this.traverse(stmt.node as AST.ASTNode);
    }
  }

  private traverseCondition(condition: AST.Expression | AST.Command): void {
    if ('type' in condition) {
      this.traverse(condition as AST.ASTNode);
    }
  }

  private traverseWord(word: AST.Word): void {
    if (word.expansion) {
      word.expansion.forEach(exp => this.traverseExpansion(exp));
    }
  }

  private traverseExpansion(expansion: AST.Expansion): void {
    if (expansion.command) {
      this.traverse(expansion.command);
    }
    if (expansion.expression) {
      this.traverse(expansion.expression);
    }
  }
}
```

### 4. AST 検証
```typescript
// src/parser/ast/validator.ts
import * as AST from './types';

export class ASTValidator {
  private errors: string[] = [];

  validate(ast: AST.Script): boolean {
    this.errors = [];
    this.validateScript(ast);
    return this.errors.length === 0;
  }

  getErrors(): string[] {
    return this.errors;
  }

  private validateScript(script: AST.Script): void {
    if (!script.body || !Array.isArray(script.body)) {
      this.errors.push('Script must have a body array');
      return;
    }

    script.body.forEach(stmt => this.validateStatement(stmt));
  }

  private validateStatement(stmt: AST.Statement): void {
    if (!stmt.node) {
      this.errors.push('Statement must have a node');
      return;
    }

    switch (stmt.node.type) {
      case 'Command':
        this.validateCommand(stmt.node);
        break;
      case 'Pipeline':
        this.validatePipeline(stmt.node);
        break;
      case 'If':
        this.validateConditional(stmt.node);
        break;
      case 'For':
      case 'While':
      case 'Until':
        this.validateLoop(stmt.node);
        break;
      case 'Function':
        this.validateFunction(stmt.node);
        break;
      case 'Assignment':
        this.validateVariable(stmt.node);
        break;
    }
  }

  private validateCommand(cmd: AST.Command): void {
    if (!cmd.name || !cmd.name.text) {
      this.errors.push('Command must have a name');
    }
  }

  private validatePipeline(pipeline: AST.Pipeline): void {
    if (!pipeline.commands || pipeline.commands.length < 2) {
      this.errors.push('Pipeline must have at least 2 commands');
    }
  }

  private validateConditional(cond: AST.Conditional): void {
    if (!cond.condition) {
      this.errors.push('Conditional must have a condition');
    }
    if (!cond.then || cond.then.length === 0) {
      this.errors.push('Conditional must have a then branch');
    }
  }

  private validateLoop(loop: AST.Loop): void {
    if (loop.type === 'For' && !loop.variable) {
      this.errors.push('For loop must have a variable');
    }
    if ((loop.type === 'While' || loop.type === 'Until') && !loop.condition) {
      this.errors.push(`${loop.type} loop must have a condition`);
    }
    if (!loop.body || loop.body.length === 0) {
      this.errors.push('Loop must have a body');
    }
  }

  private validateFunction(func: AST.FunctionDef): void {
    if (!func.name) {
      this.errors.push('Function must have a name');
    }
    if (!func.body || func.body.length === 0) {
      this.errors.push('Function must have a body');
    }
  }

  private validateVariable(variable: AST.Variable): void {
    if (!variable.name) {
      this.errors.push('Variable must have a name');
    }
    if (variable.value === undefined) {
      this.errors.push('Variable must have a value');
    }
  }
}
```

## 成果物
- src/parser/ast/types.ts
- src/parser/ast/builder.ts
- src/parser/ast/traversal.ts
- src/parser/ast/validator.ts

## テスト方法
1. 各AST型が正しく定義されている
2. ASTビルダーが正しくノードを生成する
3. トラバーサルが全ノードを訪問する
4. バリデーターがエラーを正しく検出する

## 完了条件
- [ ] 完全なAST型定義が完了している
- [ ] ASTビルダーが実装されている
- [ ] ASTトラバーサルが実装されている
- [ ] AST検証機能が実装されている
- [ ] 全てのBash構文要素がカバーされている