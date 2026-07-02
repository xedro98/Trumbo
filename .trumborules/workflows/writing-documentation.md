# General writing guide

# How to write for Trumbo

Trumbo documentation is written for developers who want something out of every paragraph they read. The job is to hand them a solution or teach them something new, not to narrate technology for its own sake.

This guide lays out the conventions that keep Trumbo docs consistent, scannable, and respectful of a reader's time.

## Crafting compelling titles

Titles like "How to do X with Y, Z technology" rarely excite, because X and Y are usually unfamiliar unless they are already well-known. Readers rarely dream of using a tool; they dream of what the tool lets them accomplish.

An effective title should:

- Evoke an emotional response
- Highlight a goal
- Offer a dream or aspiration
- Challenge or comment on a belief
- Address a problem

Writing about specific problems is more impactful than writing generally. A specific approach that works can be replicated across scenarios; a generic one cannot.

- "Time management for everyone" can be a $15 ebook
- "Time management for executives" is a $2000 workshop

Aim for titles that answer questions people are actually asking, or articulate thoughts people have but cannot quite express.

Prefer the reader's perspective over the author's: "How you can do something" engages more than "How I do something." When the content is subjective and the goal is to share a personal story, the first-person framing is fine — "How I made a million dollars" is more honest than "How to make a million dollars."

Take it further with specific conditions — a target audience or a timeframe:

- How to set up Braintrust
- How to set up Braintrust in 5 minutes

## No adjectives — use evidence

Almost always avoid adjectives and use evidence instead. Instead of "production ready," write something like "scaling this to 100 servers or 1 million documents per second." Numbers communicate exactly what the product does. If adjectives are needed instead of evidence, the claim is probably invented.

There is no reason to say "blazingly fast" unless the phrase is already well-known. Say "200 times faster" or "30% faster" instead. A 30% improvement in recommendation-system speed is concrete and impressive.

A useful test for any claim: can it be

- Visualized
- Proven false
- Said only by you

If a claim clears all three, it is far more likely to resonate, because only you can say it.

## Keep it digestible

- Aim for 5-minute reads
- Write at a Grade 10 reading level
- Break up long paragraphs
- Use headers and bullet points

## Make it scannable

- Bold key points
- Use subheadings every 3–4 paragraphs
- Include plenty of white space
- Add relevant examples

This structure works for a tweet thread or a full blog post. The goal is making complex ideas accessible.

# Guide to writing Trumbo documentation

## General principles for explaining features

When documenting a feature, start with a human-readable explanation in simple terms. Skip jargon and explain it as if talking to someone who has never seen it before. This sets the foundation for everything that follows.

Combine location and usage into one flowing section. Tell users exactly where to find the feature and how to use it, weaving the instructions into natural prose with a good balance of bullet points, numbered lists, code examples (if applicable), Mintlify components, and headers/subheaders. Users should not have to jump between separate "where is it" and "how do I use it" sections.

Show the feature in action with real examples — actual files, workflows, or code. Users need concrete implementations, not abstract descriptions. This is where understanding turns into practical knowledge.

Include an inspiration section that sparks imagination. It pushes people from understanding to action by showing what becomes possible when the feature is used creatively. This is what separates good documentation from great documentation.

## Writing principles that work

### Write for action, not just understanding

Documentation should motivate users to try things. Instead of only explaining how something works, focus on what users can accomplish with it. The inspiration section is crucial — it transforms passive readers into active users.

### Create a natural story flow

It should feel like a conversation that progresses naturally from "what is this?" to "how do I use it?" to "here's a real example" to "imagine what you could do with this."

### Show real examples, not toy demos

Provide actual workflow files, real code snippets, and concrete implementations users can copy and adapt. Abstract examples do not help anyone — users want to see exactly what they will be working with.

### Keep it scannable but not fragmented

Write prose that flows naturally when read completely, but structure it so users can quickly find specific information when troubleshooting. Avoid dense walls of text, but also avoid over-formatting with excessive bullet points and bold headers. Aim for a nice visual hierarchy that balances all elements, so the page can be scanned quickly to find what is needed.

## Language and tone guidelines

Write clearly without dumbing things down. Use simple language when possible, but don't avoid technical terms users need to know. Explain concepts in terms of what users can achieve rather than how the software works internally.

Keep the writing conversational and encouraging. Phrases like "you can also try" or "when that works" feel more natural than rigid instructional language. Help users feel confident about trying new things.

Keep content concise and purposeful. Every sentence should either help users understand something or help them do something. If it serves neither purpose, cut it.

Build in context and reasoning. Users want to understand why they are doing something, not just what to do. This builds confidence and helps them troubleshoot when things don't work exactly as expected.

## Practical implementation

Structure each feature page consistently with the four-section approach, but let the content flow naturally within that structure. Use visual assets like videos and screenshots to complement the written content — they often communicate more effectively than paragraphs of description.

Link generously to related resources, examples, and deeper documentation. Users should never feel stuck or wonder where to go next. Maintain a repository of real examples users can reference and adapt to their own needs.

The goal is documentation that feels like helpful guidance from an experienced colleague, not a technical manual. Users should finish reading feeling excited about what they can accomplish, not just informed about what the feature does.

## Balance structure with flexibility

While consistent documentation structure matters, the content should still feel less rigid and more natural. The writing should follow guidelines while remaining conversational and engaging.

## Bad examples

Avoid the pattern of a bullet point with **Bold Text**, a colon, and then more text:

<bad_example_of_writing>
#### macOS

1. **Switch to bash**: Go to Trumbo Settings → Terminal → Default Terminal Profile → Select "bash"
2. **Disable Oh-My-Zsh temporarily**: If using zsh, try `mv ~/.zshrc ~/.zshrc.backup` and restart VSCode
3. **Set environment**: Add to your shell config: `export TERM=xterm-256color`

#### Windows

1. **Use PowerShell 7**: Install from Microsoft Store, then select it in Trumbo settings
2. **Disable Windows ConPTY**: VSCode Settings → Terminal › Integrated: Windows Enable Conpty → Uncheck
3. **Try Command Prompt**: Sometimes simpler is better - switch to cmd.exe

#### Linux

1. **Use bash**: Most reliable option - select in Trumbo settings
2. **Check permissions**: Ensure VSCode has terminal access permissions
3. **Disable custom prompts**: Comment out prompt customizations in `.bashrc`

</bad_example_of_writing>

Instead, strive for docs that read well. Bullet points and numbered lists are fine, but the page should read naturally and be delightful to scan hierarchically. There should be a good balance between blocks of text, code snippets, paragraphs, numbered lists, and bullet points. When scanning the documentation visually, it should feel like a tasteful, well-composed page.

<good_example_of_writing>
#### macOS

The most common fix is switching to bash. Navigate to Trumbo Settings → Terminal → Default Terminal Profile and select "bash" from the dropdown.

If you're still having issues, Oh-My-Zsh might be interfering with terminal integration. Try temporarily disabling it:
- Run `mv ~/.zshrc ~/.zshrc.backup`
- Restart VSCode

You can also add `export TERM=xterm-256color` to your shell configuration file to improve compatibility.

#### Windows

PowerShell 7 provides the most reliable experience. Install it from the Microsoft Store, then select it in your Trumbo settings.

Still seeing problems? Try these solutions:
- Disable Windows ConPTY: VSCode Settings → Terminal › Integrated: Windows Enable Conpty → uncheck
- Switch to Command Prompt (cmd.exe) - sometimes simpler shells work better

#### Linux

Bash is your most dependable option. Select it in Trumbo settings if you haven't already.

Check these common issues:
- Ensure VSCode has terminal access permissions
- Temporarily comment out custom prompt configurations in your `.bashrc`
</good_example_of_writing>

This is much more natural to read. It creates a conversational flow, and bullet points are used idiomatically.

# Using Mintlify components idiomatically

Mintlify's custom components can transform basic documentation into engaging, scannable content that users actually want to read. Here's how to use them effectively.

## Visual content with frames

Videos and images should be wrapped in `<Frame>` components rather than using raw HTML or markdown. This creates consistent styling and proper responsive behavior.

For videos, embed them directly rather than linking externally. Users are much more likely to watch a 30-second demonstration than click through to another platform:

```jsx
<Frame>
	<iframe
		style={{ width: "100%", aspectRatio: "16/9" }}
		src="https://www.youtube.com/embed/your-video-id"
		title="Feature demonstration"
		frameBorder="0"
		allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
		allowFullScreen
	/>
</Frame>
```

Screenshots work similarly — the frame provides visual polish and consistency:

```jsx
<Frame>
	<img src="/path/to/screenshot.png" alt="Descriptive alt text" />
</Frame>
```

## Cards for navigation and overview

Cards excel at creating scannable overviews that link to detailed documentation. They're perfect for feature listings, getting started guides, or any section where users need to choose their path.

Use the two-column layout for related features:

```jsx
<Columns cols={2}>
  <Card title="Feature Name" icon="relevant-icon" href="/link/to/docs">
    Brief description that explains what this feature does and why someone would use it.
  </Card>
  
  <Card title="Related Feature" icon="another-icon" href="/another/link">
    Another concise explanation that helps users understand the value proposition.
  </Card>
</Columns>
```

The key is writing card descriptions that are informative enough to help users decide whether to click through, but concise enough to scan quickly. Each card should answer "what does this do?" and "why would I need this?"

## Tips and notes for context

Use `<Tip>` components for helpful information that enhances the main content without cluttering it:

```jsx
<Tip>
	Pro tip: You can combine multiple @ mentions in a single message to give Trumbo 
	comprehensive context about your issue.
</Tip>
```

`<Note>` components work well for important caveats or technical limitations:

```jsx
<Note>
	Due to VS Code limitations, some features require specific settings to work properly.
</Note>
```

`<Info>` is also useful:

<Info>
	**Quick Fix**: If you're experiencing terminal issues, try switching to a simpler shell like `bash` in the Trumbo settings.
	This resolves 90% of terminal integration problems.
</Info>

**Never** fall into the **Bold Text** - description pattern identified above as bad writing. Content should flow naturally as connected thoughts rather than feeling like a templated AI response with forced formatting.

## When to use bullet points and numbered lists strategically

Bullet points serve functional purposes. Use them for:

**Sequential actions or troubleshooting steps** where users need to follow a specific order:
1. Install the extension
2. Restart VSCode
3. Check the settings panel

**Lists of related options** where users need to choose one approach:
- Try PowerShell 7 for the most reliable experience
- Switch to Command Prompt if you're still having issues
- Use WSL Bash for Linux compatibility

**Quick reference items** that users might need to scan quickly when problem-solving.

**Improving visual hierarchy** when there's a wall of text — a good time to introduce bullet points or numbered lists.

Each bulleted item or numbered list entry should be a discrete action or piece of information that benefits from being visually separated. This is a key tool for achieving the well-composed reading experience described earlier.

<good_example_of_bullet_points>
## Finding and configuring terminal settings

You can access Trumbo's terminal settings by clicking the settings icon in the Trumbo sidebar, then navigating to the Terminal section. These settings control how Trumbo interacts with your system's terminal.

- The **Default Terminal Profile** setting determines which shell Trumbo uses for executing commands. If you're experiencing issues, this is usually the first thing to change. A reliable default is `bash` on all systems, even when `zsh` is the regular daily shell.

- **Shell Integration Timeout** controls how long Trumbo waits for the terminal to become ready. The default is 4 seconds, but with a heavy shell configuration (lots of plugins, slow startup scripts), it may need to increase to 10 or even 15 seconds. WSL environments and SSH connections often need longer timeouts.

- The **Enable Aggressive Terminal Reuse** setting determines whether Trumbo tries to reuse existing terminals even when they're not in the correct directory. When this causes problems (commands running in the wrong directory, virtual environment issues), disabling it creates more terminal instances but ensures each command runs in a clean state.

- **Terminal Output Line Limit** sets how many lines of output Trumbo will read from commands. The default of 500 lines works for most cases, but it may need adjusting. For verbose build outputs, increase it. For commands with progress bars that spam thousands of lines, decrease it to around 100 to avoid consuming too many tokens.
</good_example_of_bullet_points>

## Write like a human, not an AI

Keep it short and direct. If something can be said in fewer words, do it. Long explanations often confuse more than they help.

Use normal sentence lengths. Mix short and long sentences naturally, like a conversation. Avoid meandering compound sentences that go on forever.

Cut the corporate speak. Instead of "utilize," say "use." Instead of "in order to," just say "to." Write like an explanation to a colleague, not a press release.

Don't over-explain obvious things. Users reading documentation probably understand basic concepts. Respect their intelligence.

## Never use em dashes or emojis

Never use them. Only AI writes with em dashes or emojis.

# Referring to Trumbo

Refer to Trumbo as a product, not a character. Use "it," not "him" or "her."

Bad:
- When Trumbo can't execute commands or read their output, you lose access to one of its most powerful capabilities.

Good:

- When Trumbo can't execute commands or read their output, you lose access to one of its most powerful capabilities.

# Crosslinking relevant documentation pages

Crosslink when finished writing. If there are relevant docs, link to them.

# Brevity is the soul of wit

Don't ramble. Use bullet points and numbered lists. Keep things easy to read.

<bad_example>

When Trumbo can't execute commands or read their output, you lose access to one of its most powerful capabilities. Terminal integration problems are frustrating, but they're usually fixable with a few simple changes.

## The most common problem: shell integration issues

If you're seeing "Shell integration unavailable" or Trumbo isn't getting command output, the issue is almost always your shell configuration. Complex shell setups with custom prompts, plugins, and fancy configurations can interfere with VSCode's terminal integration.

**Switch to bash first.** This fixes the problem 90% of the time. Navigate to Trumbo Settings → Terminal → Default Terminal Profile and select "bash" from the dropdown. Restart VSCode after making this change.

Still having issues? Try increasing the shell integration timeout. Go to Trumbo Settings → Terminal → Shell Integration Timeout and change it from 4 seconds to 10 seconds. Heavy shell configurations need more time to initialize properly.

If commands are running in the wrong directories or you're seeing weird behavior, disable aggressive terminal reuse. In Trumbo Settings → Terminal, uncheck "Enable aggressive terminal reuse." This creates more terminal instances but ensures each command runs in a clean environment.

</bad_example>

The first part is filler, useless to any serious developer. It reads like a non-technical writer who doesn't value clean, straightforward information.

<good_example>
## Shell integration issues

If you're seeing "Shell integration unavailable" or Trumbo can't read command output, your shell configuration is interfering with VS Code's terminal integration.

**Switch to bash first.** Go to Trumbo Settings → Terminal → Default Terminal Profile and select "bash." This fixes 90% of problems.

Still broken? Try these:
- Increase shell integration timeout to 10 seconds in Trumbo Settings → Terminal
- Disable "aggressive terminal reuse" if commands run in wrong directories
- Restart VSCode after making changes
</good_example>

The good version cuts straight to the problem and solution. No hand-holding, no emotional language about frustration — just the facts: what's wrong, how to fix it, what to try next. It respects that developers want information, not sympathy.

Always consider the audience. The audience is developers who don't want their time wasted. Give them the information. Use bullet points and numbered lists. Prose is good, but every word should actually mean something to the developer reading it.

# Before you start writing docs

1. Internalize these guidelines.

2. Read `book/docs.json` to understand the structure of the docs. This helps during the final pass, when cross-linking to relevant docs.

3. Read some good examples already in the repo:

- book/features/slash-commands/workflows.mdx
- book/features/slash-commands/new-task.mdx
- book/features/at-mentions/overview.mdx
- book/features/drag-and-drop.mdx

4. If the user specifies any other instructions, follow them.
