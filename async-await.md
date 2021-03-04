# Async-Awaitifying Pico-Go

## Rationale

There is a signficant maintenance overhead with the inherited Pymakr code-base. It's very, very heavily callback-based and callbacks can traverse multiple levels of code. 

Making changes, especially those which should rightly be asynchronous, is *really* hard work and it's too tempting to write synchronous code to avoid the pain of refactoring and adding extra layers of callback spaghetti.

If the goal is to evolve Pico-Go and keep it first class, we can't be hampered with this legacy.

## Approach

A three-phase approach will be used: the first is all about laying async-await groundwork and the second is about switching to it.

> Work is now complete!

### Phase 1

* For each `method(cb)` , add a `methodAsync()` ;
* Make `method(cb)` call `methodAsync()` (using `then` and `catch`) instead of doing the work directly. For example:

```js
  send(msg, cb) {
    this.sendAsync(msg, cb != undefined)
      .then(() => {
        if (cb) cb();
      })
      .catch(err => {
        if (cb) cb(err);
      });
  }

  async sendAsync(msg, drain = true) {
    let data = Buffer.from(msg, 'binary');
    await this.sendRawAsync(data, drain);
  }
```

This should ensure that nothing breaks even though things are still a work-in-progress.

### Phase 2

* Systematically replace callback-based methods with their async equivalents;
* Remove callback-based methods;
* Rename async methods so they lose their `Async`  suffix.

### Phase 3

* Audit of synchronous code that should really be asynchronous.
* Code changes to support findings.

### Additional Goals

Additionally, and throughout both phases, the opportunity will be taken to normalise the code, e.g.:

* using `import` instead of a mixture if that and `require`;
* enforcing the use of trailing semi-colons;
* using `let` and `const` instead of `var`;
* using single quotes consistently for strings;
* Using `PascalCase` for classes and `camelCase` for variables and methods, instead of `stuff_like_this`;
* generally beautifying code to give consistent presentation.

## Progress

> Work is now complete!

```
.
├── board
│   ├── authorize.js              [Phase 3 Complete]
│   ├── project-status.js         [Phase 3 Complete]
│   ├── pyboard.js                [Phase 3 Complete]
│   ├── runner.js                 [Phase 3 Complete]
│   ├── shell.js                  [Phase 3 Complete]
│   └── sync.js                   [Phase 3 Complete]
├── connections
│   ├── telnet
│   │   ├── format.js             [No work required]
│   │   ├── telnetcli.js          [No work required]
│   │   └── util-telnet.js        [No work required]
│   ├── pyserial.js               [Phase 3 Complete]
│   ├── pysocket.js               [Phase 3 Complete]
│   └── pytelnet.js               [Phase 3 Complete]
├── helpers
│   ├── logger.js                 [Phase 3 Complete]
│   └── utils.js                  [Phase 3 Complete]
├── main
│   ├── api-wrapper.js            [Phase 3 Complete]
│   ├── panel-view.js             [Phase 3 Complete]
│   ├── settings-wrapper.js       [Phase 3 Complete]
│   └── terminal.js               [Phase 3 Complete]
├── stubs
│   └── stubs-manager.js          [Phase 3 Complete]
├── activator.js                  [Phase 3 Complete]
├── config.js                     [Phase 3 Complete]
└── pymakr.js                     [Phase 3 Complete]

```