// Generated by CoffeeScript 1.12.7

/*
 * Omelette Simple Auto Completion for Node
 */

(function() {
  var EventEmitter, Omelette, depthOf, fs, os, path,
    hasProp = {}.hasOwnProperty,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    slice = [].slice;

  EventEmitter = require("events").EventEmitter;

  path = require("path");

  fs = require("fs");

  os = require("os");

  depthOf = function(object) {
    var depth, key, level;
    level = 1;
    for (key in object) {
      if (!hasProp.call(object, key)) continue;
      if (typeof object[key] === 'object') {
        depth = depthOf(object[key]) + 1;
        level = Math.max(depth, level);
      }
    }
    return level;
  };

  Omelette = (function(superClass) {
    var log;

    extend(Omelette, superClass);

    log = console.log;

    function Omelette() {
      var isFish, isZsh, ref, ref1;
      Omelette.__super__.constructor.call(this);
      this.compgen = process.argv.indexOf("--compgen");
      this.install = process.argv.indexOf("--completion") > -1;
      this.installFish = process.argv.indexOf("--completion-fish") > -1;
      isZsh = process.argv.indexOf("--compzsh") > -1;
      isFish = process.argv.indexOf("--compfish") > -1;
      this.isDebug = process.argv.indexOf("--debug") > -1;
      this.fragment = parseInt(process.argv[this.compgen + 1]) - (isZsh ? 1 : 0);
      this.line = process.argv.slice(this.compgen + 3).join(' ');
      this.word = (ref = this.line) != null ? ref.trim().split(/\s+/).pop() : void 0;
      ref1 = process.env, this.HOME = ref1.HOME, this.SHELL = ref1.SHELL;
    }

    Omelette.prototype.setProgram = function(programs) {
      programs = programs.split('|');
      this.program = programs[0];
      return this.programs = programs.map(function(program) {
        return program.replace(/[^A-Za-z0-9\.\_\-]/g, '');
      });
    };

    Omelette.prototype.setFragments = function() {
      var fragments1;
      fragments1 = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      this.fragments = fragments1;
    };

    Omelette.prototype.generate = function() {
      var data;
      data = {
        before: this.word,
        fragment: this.fragment,
        line: this.line,
        reply: this.reply
      };
      this.emit("complete", this.fragments[this.fragment - 1], data);
      this.emit(this.fragments[this.fragment - 1], data);
      this.emit("$" + this.fragment, data);
      return process.exit();
    };

    Omelette.prototype.reply = function(words) {
      if (words == null) {
        words = [];
      }
      console.log(typeof words.join === "function" ? words.join(os.EOL) : void 0);
      return process.exit();
    };

    Omelette.prototype.tree = function(objectTree) {
      var depth, i, level, ref;
      if (objectTree == null) {
        objectTree = {};
      }
      depth = depthOf(objectTree);
      for (level = i = 1, ref = depth; 1 <= ref ? i <= ref : i >= ref; level = 1 <= ref ? ++i : --i) {
        this.on("$" + level, function(arg) {
          var accessor, fragment, lastIndex, line, replies, reply;
          fragment = arg.fragment, reply = arg.reply, line = arg.line;
          if (!(/\s+/.test(line.slice(-1)))) {
            lastIndex = -1;
          }
          accessor = new Function('_', "return _['" + (line.split(/\s+/).slice(1, lastIndex).filter(Boolean).join("']['")) + "']");
          replies = fragment === 1 ? Object.keys(objectTree) : accessor(objectTree);
          return reply((function(replies) {
            if (replies instanceof Function) {
              return replies();
            }
            if (replies instanceof Array) {
              return replies;
            }
            if (replies instanceof Object) {
              return Object.keys(replies);
            }
          })(replies));
        });
      }
      return this;
    };

    Omelette.prototype.generateCompletionCode = function() {
      var completions;
      completions = this.programs.map((function(_this) {
        return function(program) {
          var completion;
          completion = "_" + program + "_completion";
          return "### " + program + " completion - begin. generated by omelette.js ###\nif type compdef &>/dev/null; then\n  " + completion + "() {\n    compadd -- `" + _this.program + " --compzsh --compgen \"${CURRENT}\" \"${words[CURRENT-1]}\" \"${BUFFER}\"`\n  }\n  compdef " + completion + " " + program + "\nelif type complete &>/dev/null; then\n  " + completion + "() {\n    local cur prev nb_colon\n    _get_comp_words_by_ref -n : cur prev\n    nb_colon=$(grep -o \":\" <<< \"$COMP_LINE\" | wc -l)\n\n    COMPREPLY=( $(compgen -W '$(" + _this.program + " --compbash --compgen \"$((COMP_CWORD - (nb_colon * 2)))\" \"$prev\" \"${COMP_LINE}\")' -- \"$cur\") )\n\n    __ltrim_colon_completions \"$cur\"\n  }\n  complete -F " + completion + " " + program + "\nfi\n### " + program + " completion - end ###";
        };
      })(this));
      if (this.isDebug) {
        completions.push(this.generateTestAliases());
      }
      return completions.join(os.EOL);
    };

    Omelette.prototype.generateCompletionCodeFish = function() {
      var completions;
      completions = this.programs.map((function(_this) {
        return function(program) {
          var completion;
          completion = "_" + program + "_completion";
          return "### " + program + " completion - begin. generated by omelette.js ###\nfunction " + completion + "\n  " + _this.program + " --compfish --compgen (count (commandline -poc)) (commandline -pt) (commandline -pb)\nend\ncomplete -f -c " + program + " -a '(" + completion + ")'\n### " + program + " completion - end ###";
        };
      })(this));
      if (this.isDebug) {
        completions.push(this.generateTestAliases());
      }
      return completions.join(os.EOL);
    };

    Omelette.prototype.generateTestAliases = function() {
      var debugAliases, debugUnaliases, fullPath;
      fullPath = path.join(process.cwd(), this.program);
      debugAliases = this.programs.map(function(program) {
        return "  alias " + program + "=" + fullPath;
      }).join(os.EOL);
      debugUnaliases = this.programs.map(function(program) {
        return "  unalias " + program;
      }).join(os.EOL);
      return "### test method ###\nomelette-debug-" + this.program + "() {\n" + debugAliases + "\n}\nomelette-nodebug-" + this.program + "() {\n" + debugUnaliases + "\n}\n### tests ###";
    };

    Omelette.prototype.checkInstall = function() {
      if (this.install) {
        log(this.generateCompletionCode());
        process.exit();
      }
      if (this.installFish) {
        log(this.generateCompletionCodeFish());
        return process.exit();
      }
    };

    Omelette.prototype.getActiveShell = function() {
      var SHELL;
      SHELL = process.env.SHELL;
      if (SHELL.match(/bash/)) {
        return 'bash';
      } else if (SHELL.match(/zsh/)) {
        return 'zsh';
      } else if (SHELL.match(/fish/)) {
        return 'fish';
      }
    };

    Omelette.prototype.getDefaultShellInitFile = function() {
      var fileAt, fileAtHome;
      fileAt = function(root) {
        return function(file) {
          return path.join(root, file);
        };
      };
      fileAtHome = fileAt(this.HOME);
      switch (this.shell = this.getActiveShell()) {
        case 'bash':
          return fileAtHome('.bash_profile');
        case 'zsh':
          return fileAtHome('.zshrc');
        case 'fish':
          return fileAtHome('.config/fish/config.fish');
      }
    };

    Omelette.prototype.setupShellInitFile = function(initFile) {
      var completionPath, programFolder, template;
      if (initFile == null) {
        initFile = this.getDefaultShellInitFile();
      }
      template = (function(_this) {
        return function(command) {
          return "\n# begin " + _this.program + " completion\n" + command + "\n# end " + _this.program + " completion\n";
        };
      })(this);
      switch (this.shell) {
        case 'bash':
          programFolder = path.join(this.HOME, "." + this.program);
          completionPath = path.join(programFolder, 'completion.sh');
          if (!fs.existsSync(programFolder)) {
            fs.mkdirSync(programFolder);
          }
          fs.writeFileSync(completionPath, this.generateCompletionCode());
          fs.appendFileSync(initFile, template("source " + completionPath));
          break;
        case 'zsh':
          fs.appendFileSync(initFile, template(". <(" + this.program + " --completion)"));
          break;
        case 'fish':
          fs.appendFileSync(initFile, template(this.program + " --completion-fish | source"));
      }
      return process.exit();
    };

    Omelette.prototype.init = function() {
      if (this.compgen > -1) {
        return this.generate();
      }
    };

    return Omelette;

  })(EventEmitter);

  module.exports = function() {
    var _omelette, args, callback, callbacks, fn, fragment, fragments, i, index, len, program, ref, ref1, template;
    template = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    if (template instanceof Array && args.length > 0) {
      ref = [template[0].trim(), args], program = ref[0], callbacks = ref[1];
      fragments = callbacks.map(function(callback, index) {
        return "arg" + index;
      });
    } else {
      ref1 = template.split(/\s+/), program = ref1[0], fragments = 2 <= ref1.length ? slice.call(ref1, 1) : [];
      callbacks = [];
    }
    fragments = fragments.map(function(fragment) {
      return fragment.replace(/^\<+|\>+$/g, '');
    });
    _omelette = new Omelette;
    _omelette.setProgram(program);
    _omelette.setFragments.apply(_omelette, fragments);
    _omelette.checkInstall();
    fn = function(callback) {
      return _omelette.on(fragment, function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        return this.reply(callback instanceof Array ? callback : callback.apply(null, args));
      });
    };
    for (index = i = 0, len = callbacks.length; i < len; index = ++i) {
      callback = callbacks[index];
      fragment = "arg" + index;
      fn(callback);
    }
    return _omelette;
  };

}).call(this);
