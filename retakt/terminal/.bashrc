# Terminal color configuration
export TERM=xterm-256color
export COLORTERM=truecolor
export FORCE_COLOR=1
export CLICOLOR=1
export CLICOLOR_FORCE=1

# Force colors for common commands
alias docker='docker --color=always'
alias ls='ls --color=always'
alias grep='grep --color=always'
alias diff='diff --color=always'

# Enable color prompt
PS1='\[\e[32m\]\u@\h\[\e[0m\]:\[\e[34m\]\w\[\e[0m\]\$ '
