module.exports.edgesToTest = [
	{edge: '/a/[/r/Causes/,/c/en/taking_final_exams/,/c/en/passing_grade/]', expected: 'Taking final exams can cause you to pass a grade.'},
	{edge: '/a/[/r/Desires/,/c/en/person/,/c/en/financial_security/]', expected: 'You want financial security.'},
	{edge: '/a/[/r/HasPrerequisite/,/c/en/write_term_paper/,/c/en/decide_on_subject/]', expected: 'If you want to write a term paper, then you should decide on a subject.'},
	{edge: '/a/[/r/CapableOf/,/c/en/person/,/c/en/butter_morning_toast/]', expected: 'You could butter your morning toast.'},
	{edge: '/a/[/r/Desires/,/c/en/person/,/c/en/other_people_to_respect/]', expected: 'You want other people to respect you.'},
	{edge: '/a/[/r/HasSubevent/,/c/en/fight/,/c/en/bleed/]', expected: 'Something that might happen when you fight is that you bleed.'},
	{edge: '/a/[/r/MotivatedByGoal/,/c/en/compete/,/c/en/try_to_win/]', expected: 'You want to compete because you want to try to win.'},
	{edge: '/a/[/r/CausesDesire/,/c/en/being_good/,/c/en/compete/]', expected: 'Being good makes you want to compete.'},
	{edge: '/a/[/r/HasSubevent/,/c/en/competing/,/c/en/try_to_win/]', expected: 'Something that might happen when you compete is you try to win.'},
	{edge: '/a/[/r/HasSubevent/,/c/en/competing/,/c/en/fair_match/]', expected: 'Something that might happen when you compete is a fair match.'},
	{edge: '/a/[/r/UsedFor/,/c/en/playing_game_with_friends/,/c/en/fun/]', expected: 'You remember that playing a game with your friends is a way to have fun.'},
	{edge: '/a/[/r/HasProperty/,/c/en/kissing_in_shower/,/c/en/fun/]', expected: 'Kissing in the shower is fun.'},
	{edge: '/a/[/r/MotivatedByGoal/,/c/en/jump_rope/,/c/en/fun/]', expected: 'You want to jump rope because it is fun.'},
	{edge: '/a/[/r/HasLastSubevent/,/c/en/jump_rope/,/c/en/breathe_hard/]', expected: 'The last thing you do when you jump rope is breathe hard.'},
	{edge: '/a/[/r/HasSubevent/,/c/en/climbing_mountain/,/c/en/breathe_hard/]', expected: 'Something that might happen when you climb a mountain is that you breathe hard.'},
	{edge: '/a/[/r/MotivatedByGoal/,/c/en/run_in_marathon/,/c/en/challenge/]', expected: 'You want to run in a marathon because it is a challenge.'},
	{edge: '/a/[/r/HasPrerequisite/,/c/en/run_in_marathon/,/c/en/train_for_months_beforehand/]', expected: 'If you want to run in a marathon, then you should train for months beforehand.'},
	// not much we can do about misspellings here...
	{edge: '/a/[/r/CausesDesire/,/c/en/purchacing_tennis_racket/,/c/en/play_tennis/]', expected: 'Purchacing a tennis racket makes you want to play tennis.'},
	{edge: '/a/[/r/MotivatedByGoal/,/c/en/meet_people/,/c/en/find_partner/]', expected: 'You want to meet people because you want to find a partner.'}
];