module.exports.edgesToTest = [
	{edge: '/a/[/r/Causes/,/c/en/taking_final_exams/,/c/en/passing_grade/]', expected: 'Taking final exams can cause you to pass a grade.'},
	{edge: '/a/[/r/Desires/,/c/en/person/,/c/en/financial_security/]', expected: 'You want financial security.'},
	{edge: '/a/[/r/HasPrerequisite/,/c/en/write_term_paper/,/c/en/decide_on_subject/]', expected: 'If you want to write a term paper, then you should decide on a subject.'}
];