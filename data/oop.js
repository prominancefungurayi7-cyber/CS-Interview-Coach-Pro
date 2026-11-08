// HCSE224 Java OOP: authored revision questions based on the six-unit outline,
// study notes, study book, assignment, classroom topic listing, and past papers.
// Answer level controls presentation depth; difficulty describes the question.
function q(unit, topic, difficulty, question, keywords, easy, medium, hard, paper = "") {
    return {
        unit, topic, difficulty, question, keywords,
        answers: { easy, medium, hard },
        modelAnswer: medium,
        pastPaper: /\b(?:September|April|November|June) 20\d{2}\b/.test(paper),
        source: paper ? `HCSE224 Unit ${unit}; ${paper}` : `HCSE224 Unit ${unit}`
    };
}

export const oopQuestions = [
    // Unit 1: introduction, Java syntax, operators and control flow.
    q(1, "Java runtime", "easy", "How does a Java source file become a running program?",
        ["javac", "bytecode", "JVM"],
        `Write Hello.java, compile it, then run it. Example: javac Hello.java creates Hello.class; java Hello runs it.`,
        `The JDK compiler javac translates .java source to platform-neutral bytecode in a .class file. The JVM loads and executes that bytecode. Example: javac Hello.java followed by java Hello.`,
        `The JVM verifies and executes bytecode, often compiling hot paths to machine code at runtime. Portability means the same bytecode can run on compatible JVMs; native libraries and platform-dependent behavior are exceptions. Example: one compiled Hello.class can run on Windows or Linux with a suitable JVM.`),
    q(1, "Program structure", "easy", "Describe the structure and entry point of a Java program.",
        ["package", "import", "class", "main"],
        `A file can start with a package and imports, then a class containing fields and methods. Example: class Hello { public static void main(String[] args) { System.out.println("Hi"); } }.`,
        `The usual order is optional package, optional imports, class declaration, fields, constructors and methods. A standalone application's entry point is public static void main(String[] args). Example: import java.util.Scanner; public class Main { public static void main(String[] args) { System.out.println("Ready"); } }.`,
        `A source file may contain several top-level classes, but at most one public top-level class, whose name matches the file. main is an entry method, not required in library classes. Example: package school; import java.util.Arrays; public class App { public static void main(String[] args) { System.out.println(Arrays.asList("A")); } }.`, "April 2025 Q1(b); November 2025 Q4(b); June 2026 Q2(c)"),
    q(1, "Types", "easy", "Give three primitive types and two reference types in Java.",
        ["int", "double", "boolean", "String", "array"],
        `Primitives hold simple values: int age = 20, double price = 2.5, boolean ready = true. References identify objects: String name = "Ada" and int[] scores = {80, 90}.`,
        `Java has eight primitives: byte, short, int, long, float, double, char and boolean. String and arrays are reference types. Example: int count = 3; String label = "books"; int[] ids = {1, 2, 3}.`,
        `Primitive variables store primitive values; reference variables can hold a reference or null. Assignment copies the value in either case, so copying a reference can point two variables at one mutable object. Example: int[] a = {1}; int[] b = a; b[0] = 2 also changes a[0].`, "April 2025 Q1(a)"),
    q(1, "Variables", "medium", "Explain local variables, fields, and variable scope.",
        ["local", "field", "scope"],
        `A local variable lives inside a method; a field belongs to an object or class. Example: class Counter { int total; void add() { int step = 1; total += step; } }.`,
        `Local variables must be assigned before reading and exist only in their block. Instance fields have one copy per object and receive defaults; static fields belong to the class. Example: two Counter objects each have their own int total, but share static int created.`,
        `Scope is lexical: a variable declared inside an if block cannot be read outside it. A local variable can shadow a field; this.field distinguishes the field. Example: class User { private String name; User(String name) { this.name = name; } }.`),
    q(1, "Casting", "medium", "What is the difference between widening and narrowing conversions?",
        ["widening", "narrowing", "cast"],
        `Widening is automatic, such as int to double. Narrowing needs a cast and can lose information. Example: double d = 4; int n = (int) 4.9; // n is 4.`,
        `A widening primitive conversion can be implicit: double x = 5. A narrowing conversion needs an explicit cast: int n = (int) 5.8 gives 5. Casting does not round; it truncates toward zero for floating-point to integer.`,
        `Widening can still lose precision, such as a large long converted to double. Narrowing can overflow: (byte) 130 becomes -126. Validate ranges before conversion when data loss matters; use Math.round for rounding, not a cast.`),
    q(1, "Operators", "easy", "Explain arithmetic and comparison operators with Java examples.",
        ["+", "%", "==", ">"],
        `Arithmetic calculates values: 7 + 2 is 9 and 7 % 2 is 1. Comparison returns true or false: 7 > 2 is true.`,
        `Arithmetic includes +, -, *, / and %. Comparison includes ==, !=, <, <=, > and >=. Example: if (score >= 50) System.out.println("Pass"); int remainder = score % 2;.`,
        `Integer division truncates: 7 / 2 is 3; use 7.0 / 2 for 3.5. % gives a remainder, including a negative remainder when the dividend is negative. Reference == compares object identity, not String contents; use equals for text.`, "November 2025 Q4(a)"),
    q(1, "Operators", "medium", "Distinguish logical, bitwise, and assignment operators.",
        ["&&", "|", "+=", "bit"],
        `&& and || combine true/false tests; & and | can work on bits; += updates a value. Example: if (age >= 18 && registered) ...; flags |= 4; count += 1.`,
        `Logical && and || short-circuit boolean expressions. Bitwise &, |, ^ and ~ operate on integer bits; & and | can also evaluate both boolean operands. Assignment includes =, += and -=. Example: if (user != null && user.isActive()) safely skips the second call when user is null.`,
        `Use short-circuiting deliberately to protect a later expression, for example list != null && !list.isEmpty(). For flags, mask & 0b0100 checks a bit and mask |= 0b0100 sets it. Compound assignment casts implicitly: byte b = 1; b += 1 compiles, while b = b + 1 needs a cast.`, "November 2025 Q4(a)"),
    q(1, "Conditionals", "easy", "How would you classify an integer as odd or even and positive, negative, or zero?",
        ["if", "else", "%", "zero"],
        `Use % 2 for odd or even, then if/else for the sign. Example: int n = -3; System.out.println(n % 2 == 0 ? "even" : "odd"); // odd.`,
        `Test n % 2 == 0 for even; otherwise it is odd. Use if (n > 0), else if (n < 0), else for positive, negative and zero. Example: n = 0 prints even and zero.`,
        `Keep the tests independent so zero is classified as even and zero. A nested condition can test n > 0 && n % 2 == 0, then n % 8 == 0. Example: 16 passes all three; 10 is positive/even but fails the multiple-of-eight test.`, "June 2026 Q1(b,c)"),
    q(1, "Selection", "medium", "When would you use a switch instead of an if/else chain?",
        ["switch", "case", "default"],
        `Use switch when choosing among fixed values. Example: switch (day) { case 1: System.out.println("Mon"); break; default: System.out.println("Other"); }.`,
        `switch selects a branch from discrete cases; if/else handles ranges and complex boolean conditions more naturally. In a classic switch, break prevents fall-through. Example: switch (choice) { case 1: price = 20; break; case 2: price = 50; break; default: throw new IllegalArgumentException(); }.`,
        `A switch expression with arrows avoids accidental fall-through: int price = switch (choice) { case 1 -> 20; case 2 -> 50; default -> throw new IllegalArgumentException("choice"); }; For Java 8 coursework, use classic switch syntax instead.`, "Java OOP assignment Q2(b)"),
    q(1, "Loops", "easy", "Compare for, while, and do-while loops.",
        ["for", "while", "do"],
        `A for loop suits a known count, while repeats while a condition is true, and do-while runs at least once. Example: for (int i = 0; i < 3; i++) System.out.println(i);.`,
        `for groups initialization, condition and update; while checks before every iteration; do-while checks after the body. Example: do { guess = scanner.nextLine(); } while (!guess.equals(secret)); asks at least once.`,
        `Choose based on the loop invariant and input protocol, and ensure progress toward termination. Example: while (balance > 0) must reject an expense <= 0 or balance may never decrease. A do-while loop is useful for menu input that must be shown once.`, "Java OOP assignment Q1(a,b)"),
    q(1, "Loops", "hard", "Write the core logic for summing the digits of an integer, including negative input.",
        ["while", "%", "/", "abs"],
        `Make the number positive, then repeatedly take the last digit with % 10 and remove it with / 10. Example: 123 gives 3 + 2 + 1 = 6.`,
        `long n = Math.abs((long) input); long sum = 0; do { sum += n % 10; n /= 10; } while (n != 0);. Using long before abs safely handles Integer.MIN_VALUE; input -1234 gives 10.`,
        `The cast must precede Math.abs because Math.abs(Integer.MIN_VALUE) overflows. Example:
long n = Math.abs((long) input);
long sum = 0;
do { sum += n % 10; n /= 10; } while (n != 0);
System.out.println(sum);
For input -1234, output is 10. The loop takes O(number of digits) time and O(1) space.`, "June 2026 Q1(d)"),
    q(1, "Input", "medium", "Show how to read and validate an integer with Scanner.",
        ["Scanner", "System.in", "hasNextInt"],
        `Scanner reads keyboard input. Example: Scanner sc = new Scanner(System.in); if (sc.hasNextInt()) { int age = sc.nextInt(); }.`,
        `Import java.util.Scanner, create Scanner sc = new Scanner(System.in), prompt the user, then check sc.hasNextInt() before sc.nextInt(). Example: rejecting "abc" avoids InputMismatchException.`,
        `Scanner token methods leave line endings behind; after nextInt(), call nextLine() before reading a whole line. Validate ranges separately: if (units < 0) reject. In reusable libraries avoid closing a Scanner around System.in when other code still needs standard input.`, "November 2025 Q3(c); June 2026 Q1(a)"),

    // Unit 2: classes, relationships, inheritance and polymorphism.
    q(2, "Classes and objects", "easy", "What is Object-Oriented Programming?",
        ["object", "class", "state", "behavior"],
        `OOP organizes code around objects with data and actions. Example: a BankAccount object stores a balance and has deposit() and withdraw() methods.`,
        `A class defines state (fields) and behavior (methods); objects are instances. Encapsulation, inheritance and polymorphism help organize changing programs. Example: Account stores a private balance and exposes deposit(amount).`,
        `OOP models cooperating objects and their responsibilities, not merely data containers. Favor cohesive classes, hide invariants, and use inheritance only for genuine substitutable relationships. Example: a PaymentService depends on a Payable interface rather than a concrete CreditCard class.`),
    q(2, "Classes and objects", "easy", "What is a class?",
        ["class", "fields", "methods", "object"],
        `A class describes what its objects store and do. Example: class Dog { String name; void bark() { System.out.println("Woof"); } }.`,
        `A class is a Java type that declares fields, constructors and methods. Example: class Student { private String name; Student(String name) { this.name = name; } String getName() { return name; } }.`,
        `A class defines a type and implementation; instance fields are per object, while static members are per class. Its public API should protect invariants. Example: BankAccount.deposit rejects a negative amount rather than exposing its balance field.`),
    q(2, "Classes and objects", "easy", "What is an object?",
        ["instance", "class", "state", "method"],
        `An object is a particular instance of a class. Example: Dog rex = new Dog(); rex.bark();.`,
        `new constructs an object, runs its constructor and returns a reference. Two Student objects can have different names while sharing the same class definition. Example: Student a = new Student("Ana"); Student b = new Student("Ben");.`,
        `Object identity is distinct from equality. Two objects can contain equal data yet be different instances; override equals and hashCode together for value equality. Example: new String("A").equals(new String("A")) is true even though the objects differ.`),
    q(2, "Constructors", "easy", "What is a constructor, and how does this refer to the current object?",
        ["constructor", "initialize", "this"],
        `A constructor sets up a new object. this means the current object. Example: Student(String name) { this.name = name; }.`,
        `A constructor has the class name and no return type. new Student("Ana") invokes it; this.name selects the field when a parameter is also called name. Constructors can be overloaded for different inputs.`,
        `Java supplies a no-argument constructor only if no constructor is declared. Constructor chaining uses this(...) or super(...) as the first statement. Validate invariants there: Account(double opening) { if (opening < 0) throw new IllegalArgumentException(); this.balance = opening; }.`),
    q(2, "Encapsulation", "easy", "What is encapsulation, and why use private fields?",
        ["private", "method", "validation", "field"],
        `Keep fields private and change them through methods. Example: a BankAccount can reject deposit(-5) instead of letting callers set balance directly.`,
        `Encapsulation combines data and behavior while controlling access. Example: private double balance; public void deposit(double amount) { if (amount <= 0) throw new IllegalArgumentException(); balance += amount; }.`,
        `A getter/setter pair is not automatically good encapsulation: a public setBalance could break the account invariant. Expose meaningful operations and validate inputs. For mutable fields such as lists, return defensive copies or immutable views when needed.`, "September 2024 Q4(b); November 2025 Q3(a)"),
    q(2, "Access", "medium", "Compare public, protected, package-private, and private access.",
        ["public", "protected", "package", "private"],
        `public is visible everywhere; private only inside the class. No modifier means same package. protected also lets subclasses use a member.`,
        `public permits access from anywhere; protected from the same package and subclasses; no modifier from the same package; private only within the declaring class. Example: a private balance is changed through a public deposit method.`,
        `A subclass in another package can access a protected inherited member through its inheritance relationship, not through any unrelated base-class instance. Top-level classes can be public or package-private, not protected/private. Prefer the narrowest access compatible with the API.`, "November 2025 Q3(a)"),
    q(2, "Packages", "medium", "What are packages and imports used for?",
        ["package", "import", "namespace"],
        `A package groups related classes; import lets you use a short class name. Example: import java.util.ArrayList; then new ArrayList<String>().`,
        `Declare package school; at the top of a source file and keep the file in the matching directory. Import java.util.List; lets code write List instead of java.util.List. Packages organize names and affect package-private access.`,
        `Imports are compile-time name conveniences, not dependency installers; the class still must be on the classpath or module path. java.lang is implicitly imported. Avoid wildcard imports in public examples when they obscure name collisions.`),
    q(2, "Inheritance", "medium", "What is inheritance, and when should a class extend another?",
        ["extends", "subclass", "super", "is-a"],
        `A subclass can reuse and specialize a parent. Example: class Dog extends Animal { } means a Dog is an Animal.`,
        `extends gives a subclass accessible members of one superclass. Example: class Staff extends Person { Staff(String name) { super(name); } } calls the parent constructor. Use it for an is-a relationship.`,
        `Inheritance should preserve substitutability: code expecting the parent must still behave correctly with the child. Java supports one class superclass but multiple interfaces. Prefer composition when one object merely uses another; a Car has an Engine rather than being an Engine.`, "September 2024 Q2; June 2026 Q3"),
    q(2, "Overloading", "medium", "What is method overloading?",
        ["same name", "parameters", "compile"],
        `Methods can share a name if their parameter lists differ. Example: add(int a, int b) and add(double a, double b).`,
        `Overloads have the same name but different parameter count or types. The compiler chooses a compatible signature from declared argument types. Changing only the return type does not create an overload.`,
        `Overload resolution happens at compile time and can be affected by widening, boxing and varargs. Example: f(int) is preferred over f(long) for an int literal. Avoid ambiguous overloads such as f(String) and f(Integer) when callers might pass null.`, "April 2025 Q2(a); September 2024 Q4(a)"),
    q(2, "Overriding", "medium", "What is method overriding?",
        ["subclass", "same signature", "runtime", "Override"],
        `A child class replaces an inherited method's behavior. Example: Dog extends Animal and overrides sound() to print "bark".`,
        `An override has the same method signature and a compatible return type. At runtime, the object's actual class selects the implementation. Example: Animal a = new Dog(); a.sound(); calls Dog.sound(). Use @Override to catch signature mistakes.`,
        `An overriding method cannot reduce visibility or declare broader checked exceptions. Static methods are hidden, not overridden; private methods are not inherited. Dynamic dispatch applies to instance methods, so a parent-typed reference can still call the child's implementation.`, "April 2025 Q2(b); September 2024 Q4(a)"),
    q(2, "Polymorphism", "medium", "What is polymorphism in Java?",
        ["reference", "subclass", "override", "runtime"],
        `One parent type can refer to different child objects. Example: Shape s = new Circle(); s.area() runs Circle's area method.`,
        `Subtype polymorphism lets code call one interface on varied implementations. Example: for (Shape s : shapes) total += s.area(); each Circle or Rectangle supplies its own area(). Overloading is often called compile-time polymorphism, but it is distinct from runtime dispatch.`,
        `Runtime dispatch uses the object's class for overridden instance methods, while accessible members are checked against the reference's compile-time type. Example: Shape s = new Circle(); s.area() dispatches to Circle, but Circle-only methods require a checked cast or pattern match.`, "November 2025 Q1(a); June 2026 Q2(a)"),
    q(2, "Abstraction", "medium", "What is an abstract class and an abstract method?",
        ["abstract", "cannot instantiate", "subclass"],
        `An abstract class is an incomplete base class you cannot create directly. Example: abstract class Shape { abstract double area(); }.`,
        `An abstract class may hold fields, constructors, concrete methods and abstract methods without bodies. A concrete subclass implements the inherited abstract methods. Example: class Circle extends Shape { double area() { return Math.PI * r * r; } }.`,
        `Use an abstract class when related types share state or implementation and a stable base contract. Its constructor still runs through super when a subclass is created. A subclass can remain abstract if it leaves methods unimplemented.`, "April 2025 Q3; November 2025 Q2"),
    q(2, "Interfaces", "medium", "What is a Java interface, and how is it implemented?",
        ["interface", "implements", "contract"],
        `An interface names behavior a class promises to provide. Example: interface Payable { boolean pay(double amount); } class Card implements Payable { public boolean pay(double amount) { return amount > 0; } }.`,
        `Interfaces define contracts and can declare abstract methods, constants, default and static methods. A concrete implementing class uses implements and makes implemented interface methods public. A class can implement several interfaces.`,
        `Prefer an interface when unrelated classes share a capability. Interface fields are implicitly public static final, and abstract methods are public; default methods can add behavior without forcing all implementers to rewrite. Example: PaymentService accepts Payable and works with Card or Wallet.`, "April 2025 Q3; November 2025 Q2(c,d)"),
    q(2, "Abstraction", "hard", "When would you choose an interface rather than an abstract class?",
        ["contract", "state", "multiple", "inheritance"],
        `Use an interface for a shared ability and an abstract class for shared code or state. Example: Card and Cash can implement Payable; both could not extend a payment base if they already extend other classes.`,
        `An interface expresses a contract across potentially unrelated types and supports multiple implementation. An abstract class can share instance fields, constructors and protected methods but consumes the one superclass slot. Example: abstract Shape holds color; Drawable is an interface implemented by Shape and other classes.`,
        `Consider API evolution and substitutability. Default interface methods can add behavior but cannot own per-instance state. Abstract bases can enforce invariants through constructors, but deep inheritance couples implementation. Example: a plug-in API exposes Formatter while an internal AbstractFormatter shares parsing helpers.`, "April 2025 Q3; November 2025 Q2"),
    q(2, "Static", "medium", "Distinguish static and instance methods.",
        ["static", "class", "instance", "this"],
        `A static method belongs to the class; an instance method needs an object. Example: Math.abs(-3) is static, while "Hi".length() is an instance call.`,
        `Call static methods via the class, such as Math.max(2, 3). Instance methods can use this and instance fields, such as account.deposit(10). A static method cannot directly access an instance field without an object.`,
        `Static methods do not participate in runtime overriding; a same-named static method in a subclass hides the parent's. Instance methods can be dynamically dispatched. Example: keep pure utility methods static, but make behavior dependent on an Account's balance an instance method.`, "September 2024 Q1(b); November 2025 Q1(b); June 2026 Q2(b)"),
    q(2, "Final", "medium", "What does final mean for a variable, method, and class?",
        ["final", "variable", "method", "class"],
        `A final variable cannot be assigned again, a final method cannot be overridden, and a final class cannot be extended. Example: final int max = 10;.`,
        `final fixes a variable's assignment after initialization, forbids overriding a method, or forbids subclassing a class. Example: final class Money { }; final void save() { }; final int limit = 100;.`,
        `A final reference can still point to a mutable object whose contents change: final List<String> names = new ArrayList<>(); names.add("A") is legal. A blank final field must be assigned exactly once, usually in a constructor. final does not itself make an object immutable.`, "September 2024 Q1(c); April 2025 Q4(a); June 2026 Q4(a)"),
    q(2, "Relationships", "medium", "Distinguish association, aggregation, and composition.",
        ["association", "aggregation", "composition", "lifetime"],
        `Association means objects are connected. Aggregation is a loose has-a link; composition is a strong owned part. Example: Teacher teaches Student; Department has Professors; Order owns OrderLines.`,
        `Association is a general link. Aggregation is a whole-part relationship where parts can outlive the whole, such as Team and Player. Composition gives the whole responsibility for its parts, such as an Order and its OrderLines. Java references alone do not enforce the ownership distinction.`,
        `Model lifecycle and ownership, not syntax alone. A Person can be associated with a Library; a Library can aggregate independently managed Books; an Order can compose line items created and controlled by that order. Avoid claiming garbage collection immediately destroys a part when its owner becomes unreachable; other references may keep it alive.`, "September 2024 Q1(a); November 2025 Q1(a); June 2026 Q2(a)"),
    q(2, "Relationships", "medium", "How does composition differ from inheritance in a Java design?",
        ["has-a", "is-a", "delegation"],
        `Inheritance means is-a; composition means has-a. Example: a Car has an Engine, so it stores Engine rather than extends Engine.`,
        `Composition delegates work to a field: class Car { private final Engine engine; Car(Engine engine) { this.engine = engine; } }. Inheritance extends a superclass and exposes its type. Use composition for replaceable collaborators.`,
        `Composition reduces coupling to a superclass implementation and supports swapping dependencies in tests. Inheritance is appropriate when the child upholds the parent contract. Example: PaymentService stores a Payable strategy; it should not extend CreditCard merely to call pay().`),
    q(2, "UML", "hard", "How do you translate a UML Person and Staff class diagram into Java?",
        ["private", "constructor", "extends", "super", "getter"],
        `A minus sign means private and a plus sign means public. Example: class Staff extends Person { private String school; Staff(String name, String school) { super(name); this.school = school; } }.`,
        `Turn UML attributes into fields and operations into methods with their stated types and visibility. For Staff extending Person, declare private school and pay, call super(name, address) in the Staff constructor, then add getters and setters. Test inherited public methods as well as Staff methods.`,
        `Preserve the UML visibility (+ public, - private), types and signatures. Example:
class Person {
  private String name, address;
  Person(String name, String address) { this.name=name; this.address=address; }
  public String getName() { return name; }
  public String getAddress() { return address; }
  public void setName(String name) { this.name=name; }
  public void setAddress(String address) { this.address=address; }
}
class Staff extends Person {
  private String school; private double pay;
  Staff(String name, String address, String school, double pay) {
    super(name, address); this.school=school; this.pay=pay;
  }
  public String getSchool() { return school; }
  public double getPay() { return pay; }
  public void setSchool(String school) { this.school=school; }
  public void setPay(double pay) { this.pay=pay; }
}
public class Main {
  public static void main(String[] args) {
    Staff s = new Staff("Ana", "Main St", "MSU", 500);
    s.setPay(550); System.out.println(s.getName() + ": " + s.getPay());
  }
}
The same pattern adapts to Student/Conventional in the June paper; test inherited and new methods.`, "September 2024 Q2; June 2026 Q3"),
    q(2, "Abstract design", "hard", "Design Shape, Circle, and Rectangle with area and perimeter methods.",
        ["abstract", "extends", "Math.PI", "area", "perimeter"],
        `Make Shape abstract with area() and perimeter(). Example: Circle(2) has area about 12.57; Rectangle(2,3) has area 6.`,
        `abstract class Shape { abstract double area(); abstract double perimeter(); } class Circle extends Shape { double r; Circle(double r) { this.r = r; } double area() { return Math.PI * r * r; } double perimeter() { return 2 * Math.PI * r; } }. Rectangle returns width * height and 2 * (width + height).`,
        `Example Java 8 implementation:
abstract class Shape {
  public abstract double area();
  public abstract double perimeter();
}
class Circle extends Shape {
  private final double r;
  Circle(double r) { if (r <= 0) throw new IllegalArgumentException(); this.r=r; }
  @Override public double area() { return Math.PI*r*r; }
  @Override public double perimeter() { return 2*Math.PI*r; }
}
class Rectangle extends Shape {
  private final double w,h;
  Rectangle(double w,double h) { if (w <= 0 || h <= 0) throw new IllegalArgumentException(); this.w=w; this.h=h; }
  @Override public double area() { return w*h; }
  @Override public double perimeter() { return 2*(w+h); }
}
public class Main {
  public static void main(String[] args) {
    for (Shape s : new Shape[]{new Circle(2),new Rectangle(2,3)})
      System.out.println(s.area() + " / " + s.perimeter());
  }
}
Circle(2) has area and perimeter about 12.57; Rectangle(2,3) has area 6 and perimeter 10.`, "September 2024 Q3(a); April 2025 Q4(b); November 2025 Q2(a,b)"),
    q(2, "Interface design", "hard", "Implement a Payable interface and a CreditCard class with a payment limit.",
        ["interface", "MAX_AMOUNT", "implements", "boolean"],
        `The interface states what a payment can do. Example: interface Payable { double MAX_AMOUNT = 1000; boolean processPayment(double amount); }.`,
        `class CreditCard implements Payable { private final String cardNumber; CreditCard(String n) { cardNumber = n; } public boolean processPayment(double amount) { return amount > 0 && amount <= MAX_AMOUNT; } public String getPaymentId() { return "credit card: " + cardNumber; } }. Also declare both methods in Payable.`,
        `Example implementation:
interface Payable {
  double MAX_AMOUNT = 1000.0;
  boolean processPayment(double amount);
  String getPaymentId();
}
class CreditCard implements Payable {
  private final String cardNumber;
  CreditCard(String cardNumber) { this.cardNumber=cardNumber; }
  @Override public boolean processPayment(double amount) {
    return Double.isFinite(amount) && amount > 0 && amount <= MAX_AMOUNT;
  }
  @Override public String getPaymentId() { return "credit card: " + cardNumber; }
}
public class Main {
  public static void main(String[] args) {
    Payable card = new CreditCard("1234");
    System.out.println(card.processPayment(200) + " " + card.getPaymentId());
  }
}
An interface constant is public static final. The paper asks for the full card identifier; real payment code should mask it, use BigDecimal for money and call a payment provider rather than treating this boolean as authorization.`, "November 2025 Q2(c,d)"),
    q(2, "Anonymous classes", "medium", "What is an anonymous class and when might you use one?",
        ["anonymous", "interface", "instance"],
        `It is a one-off class without a name. Example: Runnable task = new Runnable() { public void run() { System.out.println("Go"); } };.`,
        `An anonymous class declares and instantiates a subclass or interface implementation in one expression. It can be useful when overriding more than one method or capturing local context. For a single-method interface, a lambda is often shorter.`,
        `An anonymous class has its own this, while a lambda's this refers to the enclosing instance. It can add state or override methods, but its extra members are not exposed through the interface type. Example: new ActionListener() { public void actionPerformed(ActionEvent e) { save(); } }.`, "April 2025 Q2(a)"),
    q(2, "Object lifecycle", "medium", "Does Java have a destructor method?",
        ["garbage", "try-with-resources", "close"],
        `No. Java uses garbage collection for memory. Close files or database connections yourself, preferably with try-with-resources. Example: try (FileReader r = new FileReader("data.txt")) { r.read(); }.`,
        `Java has constructors but no deterministic destructor. Garbage collection reclaims unreachable objects, not necessarily immediately. AutoCloseable plus try-with-resources manages external resources such as files and JDBC connections.`,
        `Do not depend on finalization for cleanup; it is unreliable and deprecated for removal. Give resource-owning objects an explicit close() method or use try-with-resources. A Connection can exhaust a pool long before garbage collection runs if it is not closed.`),
    // Unit 3: built-in classes, utility classes, dates and strings.
    q(3, "String", "easy", "Show two useful String methods and explain String immutability.",
        ["length", "substring", "immutable"],
        `String text = "Java"; text.length() is 4 and text.substring(1) is "ava". A String value does not change; methods return new values.`,
        `String has methods such as length(), substring(), contains() and toUpperCase(). Example: "Java".substring(0, 2) returns "Ja". String is immutable, so String upper = text.toUpperCase() stores the new result.`,
        `Immutability makes strings safe to share and usable as map keys. Repeated concatenation inside large loops can create many objects; use StringBuilder. substring indexes are zero-based with an exclusive end: "Java".substring(1, 3) is "av".`, "November 2025 Q3(b)"),
    q(3, "String", "medium", "Why should Java String contents usually be compared with equals rather than ==?",
        ["equals", "==", "reference"],
        `== asks whether two references are the same object; equals asks whether their text matches. Example: new String("A").equals("A") is true.`,
        `String overrides equals for content comparison. == compares reference identity, which may appear to work for interned literals but fails for separately created equal strings. Example: String a = new String("yes"); a == "yes" is false, a.equals("yes") is true.`,
        `If a may be null, use "yes".equals(a) to avoid a NullPointerException. For case-insensitive text use equalsIgnoreCase; for locale-sensitive ordering use Collator rather than assuming compareTo handles all languages correctly.`),
    q(3, "StringBuilder", "medium", "When would you use StringBuilder instead of String concatenation?",
        ["StringBuilder", "append", "loop"],
        `Use StringBuilder when joining many pieces in a loop. Example: StringBuilder b = new StringBuilder(); b.append("Hi"); b.append("!");.`,
        `Strings are immutable, so repeated s += part can allocate repeatedly. StringBuilder has a mutable buffer: for (String name : names) b.append(name).append(","); then b.toString(). For a few fixed pieces, + remains clear.`,
        `StringBuilder is not synchronized; StringBuffer is synchronized but usually unnecessary for local construction. Pre-sizing with new StringBuilder(capacity) can reduce reallocations. For structured joining, StringJoiner or Collectors.joining may be clearer.`),
    q(3, "Math", "easy", "Use the Math class for absolute values, powers, and circle area.",
        ["Math.abs", "Math.pow", "Math.PI"],
        `Math.abs(-5) is 5. Math.pow(2, 3) is 8. For radius 2, Math.PI * 2 * 2 gives the circle's area.`,
        `Math provides static methods and constants: Math.abs(-4), Math.max(3, 7), Math.pow(2, 3), Math.PI. A circle area is Math.PI * radius * radius. Validate radius >= 0 before calculating.`,
        `Math.pow returns double even for integer inputs; direct multiplication may be simpler for small integer powers. Beware Math.abs(Integer.MIN_VALUE) overflow: cast to long first. Example: Math.abs((long) Integer.MIN_VALUE) is 2147483648.`),
    q(3, "Wrappers", "medium", "What are wrapper classes and autoboxing?",
        ["Integer", "int", "autoboxing", "parseInt"],
        `Integer wraps an int as an object. Example: List<Integer> values = new ArrayList<>(); values.add(3); Java boxes 3 automatically.`,
        `Generics use reference types, so List<Integer> stores Integer objects, not primitive int values. Autoboxing converts int to Integer; unboxing does the reverse. Integer.parseInt("42") returns a primitive int.`,
        `Unboxing null throws NullPointerException; compare boxed numbers by value with equals or unbox them. Large collections of wrappers add memory and allocation overhead. Example: Integer n = null; int x = n fails at runtime.`),
    q(3, "System", "easy", "What are System.out, System.err, and System.in?",
        ["System.out", "System.err", "System.in"],
        `System.out prints normal output, System.err prints errors, and System.in reads input. Example: System.out.println("Ready");.`,
        `System is a core class exposing standard streams. Print ordinary results with System.out, diagnostic errors with System.err, and read input by wrapping System.in in a Scanner or reader. Example: new Scanner(System.in).nextLine().`,
        `The streams are process-wide and can be redirected independently by a shell. In reusable applications prefer a logging API over scattering System.out calls; avoid closing System.in unexpectedly. System.exit(0) ends the JVM and is unsuitable for reusable library methods.`),
    q(3, "Arrays", "medium", "How do Arrays.sort, Arrays.toString, and Arrays.binarySearch work?",
        ["Arrays.sort", "Arrays.toString", "binarySearch"],
        `Arrays.sort puts items in order; Arrays.toString prints them. Example: int[] a = {3, 1}; Arrays.sort(a); System.out.println(Arrays.toString(a)); // [1, 3].`,
        `java.util.Arrays.sort sorts an array in place; Arrays.toString formats a one-dimensional array. binarySearch looks for a key in a sorted array. Example: after sorting {3,1,2}, Arrays.binarySearch(a, 2) returns 1.`,
        `binarySearch requires the same ordering used to sort; otherwise results are unspecified. A negative result encodes the insertion point as -(point)-1. For arrays of objects, provide a Comparator or rely on Comparable.`),
    q(3, "Scanner", "medium", "What is the difference between Scanner.next(), nextLine(), and nextInt()?",
        ["nextLine", "nextInt", "token"],
        `next() reads one word, nextLine() reads the whole line, and nextInt() reads an integer. Example: "Ada Lovelace" gives "Ada" with next(), but the full name with nextLine().`,
        `Scanner token methods use whitespace delimiters by default. nextInt() parses the next integer token; nextLine() consumes the rest of the current line. After nextInt(), call nextLine() once before reading a following full line.`,
        `Use hasNextInt() or catch InputMismatchException for bad numeric input. Token parsing may depend on Scanner's locale, so specify one if decimal notation matters. For large input volumes BufferedReader may be faster.`),
    q(3, "Date and time", "medium", "How do Date, Calendar, and SimpleDateFormat compare with java.time?",
        ["Date", "Calendar", "SimpleDateFormat", "LocalDate"],
        `Older Java code uses Date and Calendar. Newer code usually uses java.time. Example: LocalDate.now().plusDays(7) gives a date one week later.`,
        `Date, Calendar and SimpleDateFormat are legacy APIs; SimpleDateFormat formats and parses text but is mutable. java.time offers immutable LocalDate, LocalDateTime, Instant and DateTimeFormatter. Example: LocalDate.parse("2026-06-01").plusDays(1).`,
        `Choose Instant for a moment on the UTC timeline, ZonedDateTime for timezone rules, and LocalDate for a calendar date without time. DateTimeFormatter is immutable and thread-safe; SimpleDateFormat is not. Specify a ZoneId when converting an Instant to a displayed local time.`),
    q(3, "StringTokenizer", "medium", "What does StringTokenizer do, and what is a common modern alternative?",
        ["StringTokenizer", "delimiter", "split"],
        `StringTokenizer breaks text into pieces. Example: new StringTokenizer("a,b", ",") gives "a" then "b".`,
        `StringTokenizer is a legacy utility that scans tokens separated by delimiters. String.split(",") is often simpler, while Scanner can parse typed input. Example: "red,blue".split(",") yields two strings.`,
        String.raw`split accepts a regular expression, so a dot delimiter needs split("\\.") in Java source; StringTokenizer treats delimiter characters literally. Neither is a full CSV parser: quoted commas require a CSV library.`),

    // Unit 4: collections, lambdas, streams, and sorting.
    q(4, "Generics", "medium", "Why use generics with collections?",
        ["generic", "type", "List"],
        `Generics tell Java what a collection holds. Example: List<String> names = new ArrayList<>(); prevents adding an Integer.`,
        `Generics provide compile-time type safety and reduce casts. Example: List<Integer> marks = new ArrayList<>(); marks.add(80); int first = marks.get(0);. The compiler rejects marks.add("eighty").`,
        `Java generics use type erasure, so List<String> and List<Integer> have the same raw runtime class. Prefer interfaces in declarations and avoid raw List, which discards checks. For a method that only reads numbers, List<? extends Number> can accept lists of several numeric subtypes.`),
    q(4, "Collections", "easy", "Compare List, Set, and Map.",
        ["List", "Set", "Map"],
        `A List keeps a sequence, a Set keeps unique elements, and a Map pairs keys with values. Example: names in a List, unique tags in a Set, marks by student ID in a Map.`,
        `List allows indexed duplicates, Set enforces uniqueness, and Map associates unique keys with values. Example: List<String> names = new ArrayList<>(); Set<String> tags = new HashSet<>(); Map<String,Integer> scores = new HashMap<>();.`,
        `Choose implementations for required guarantees: ArrayList supports fast indexed reads, HashSet/HashMap give average constant-time lookup, and TreeSet/TreeMap keep keys sorted. Mutable keys with unstable equals/hashCode can break hash lookups.`),
    q(4, "ArrayList", "medium", "How do you add, read, update, and remove items in an ArrayList?",
        ["ArrayList", "add", "get", "set", "remove"],
        `Create a list and use add, get, set and remove. Example: List<String> names = new ArrayList<>(); names.add("Ana"); names.set(0, "Ann");.`,
        `ArrayList is a resizable array. add(x) appends, get(i) reads, set(i,x) replaces, and remove(i) deletes by index. Example: List<String> a = new ArrayList<>(); a.add("A"); a.add("B"); a.remove(0); leaves ["B"].`,
        `Index operations require 0 <= index < size, except add(index,x) permits index == size. Insertion or removal in the middle shifts later elements and is O(n). Removing Integer from List<Integer> is ambiguous: remove(1) removes index 1, while remove(Integer.valueOf(1)) removes the value.`),
    q(4, "Lambdas", "medium", "What is a lambda expression and a functional interface?",
        ["lambda", "functional interface", "one abstract method"],
        `A lambda is a short function-like value for an interface with one abstract method. Example: Runnable r = () -> System.out.println("Hi");.`,
        `A functional interface has one abstract method; a lambda supplies its implementation. Example: Comparator<String> byLength = (a, b) -> Integer.compare(a.length(), b.length());. @FunctionalInterface asks the compiler to enforce the rule.`,
        `Lambdas capture local variables only when they are final or effectively final. They work with target typing, so (a,b) -> ... gets parameter types from Comparator<String>. Default methods do not count toward the single abstract method.`),
    q(4, "Sorting", "hard", "Create Product objects and sort an ArrayList with a lambda.",
        ["Product", "ArrayList", "sort", "Comparator"],
        `Store products in a List, then sort by price. Example: products.sort((a, b) -> Double.compare(a.price, b.price));.`,
        `class Product { int id; String name; double price; Product(int id, String name, double price) { this.id=id; this.name=name; this.price=price; } }. Add Product(1,"Laptop",250), Product(3,"Keyboard",12.5), Product(2,"Mouse",5.6), then products.sort((a,b) -> Double.compare(a.price,b.price)); output is Mouse, Keyboard, Laptop.`,
        `Example Java 8 program:
import java.util.*;
class Product {
  final int id; final String name; final double price;
  Product(int id,String name,double price) { this.id=id; this.name=name; this.price=price; }
  @Override public String toString() { return id + " " + name + " " + price; }
}
public class Main {
  public static void main(String[] args) {
    List<Product> products = new ArrayList<>();
    products.add(new Product(1,"HP Laptop",250));
    products.add(new Product(3,"Keyboard",12.50));
    products.add(new Product(2,"Dell Mouse",5.60));
    products.add(new Product(4,"Samsung A5",170));
    products.sort((a,b) -> Double.compare(a.price,b.price));
    products.forEach(System.out::println);
  }
}
Output order is Dell Mouse, Keyboard, Samsung A5, HP Laptop. Double.compare avoids truncation; use BigDecimal for real prices.`, "September 2024 Q3(b-d); June 2026 Q4(b-d)"),
    q(4, "Sorting", "medium", "Distinguish Comparable from Comparator.",
        ["Comparable", "Comparator", "compareTo"],
        `Comparable gives a class its usual order; Comparator supplies an order when sorting. Example: String has a natural alphabetical order, but a Comparator can sort names by length.`,
        `Implement Comparable<Product> and compareTo for a natural order, such as id. Use Comparator.comparingDouble(Product::getPrice) for an alternative order without changing the class. Collections.sort(list, comparator) or list.sort(comparator) applies it.`,
        `Comparators should be consistent, transitive, and ideally consistent with equals where sorted sets/maps are used. Never subtract arbitrary ints in compareTo because of overflow; use Integer.compare(a.id,b.id). Comparator chains can express multiple sort keys.`),
    q(4, "Method references", "medium", "How does a method reference relate to a lambda?",
        ["method reference", "::", "lambda"],
        `A method reference names an existing method instead of writing a lambda. Example: names.forEach(System.out::println) means name -> System.out.println(name).`,
        `The :: operator can refer to static, instance, or constructor methods when the target functional interface matches. Example: list.stream().map(String::trim) is equivalent to s -> s.trim().`,
        `Method references do not invoke the method immediately; they provide behavior to a functional interface. Overload resolution still depends on the target type. Use a lambda when the adaptation needs extra logic, such as s -> s.trim().toLowerCase().`),
    q(4, "Streams", "medium", "Explain a Stream pipeline with filter, map, and a terminal operation.",
        ["stream", "filter", "map", "collect"],
        `A stream processes items in steps. Example: names.stream().filter(n -> n.length() > 3).map(String::toUpperCase).collect(Collectors.toList()) keeps long names in capitals.`,
        `A pipeline has a source, lazy intermediate operations such as filter/map, and a terminal operation such as collect/count/forEach. In Java 8: List<String> result = names.stream().filter(n -> n.startsWith("A")).collect(Collectors.toList());.`,
        `Intermediate operations generally run only when a terminal operation starts traversal. Streams are single-use; do not reuse one after a terminal operation. Avoid side effects inside map/filter, especially with parallel streams. A stream does not mutate its source unless your actions explicitly do so.`),
    q(4, "Collectors", "medium", "How do collectors group or summarize data?",
        ["Collectors", "groupingBy", "counting"],
        `Collectors turn a stream into a useful result. Example: names.stream().collect(Collectors.joining(", ")) makes one comma-separated line.`,
        `Collectors.toList gathers items; groupingBy groups by a key; counting counts each group. Example: Map<String,Long> counts = students.stream().collect(Collectors.groupingBy(Student::getProgram, Collectors.counting()));.`,
        `The downstream collector changes the grouped result: groupingBy(Product::getCategory, summingDouble(Product::getPrice)) totals prices by category. toMap needs a merge function if keys repeat; otherwise duplicate keys throw an exception.`),
    q(4, "StringJoiner", "easy", "What is StringJoiner used for?",
        ["StringJoiner", "delimiter", "add"],
        `It joins text with a separator. Example: StringJoiner j = new StringJoiner(", "); j.add("A").add("B"); j.toString() is "A, B".`,
        `StringJoiner can add a delimiter, prefix and suffix. Example: new StringJoiner(", ", "[", "]").add("red").add("blue").toString() gives [red, blue]. Collectors.joining uses related behavior for streams.`,
        `StringJoiner handles delimiters without a trailing comma; setEmptyValue can control output when no elements were added. It does not escape CSV, JSON or SQL content, so use a proper serializer for those formats.`),
    q(4, "Parallel sorting", "medium", "When does Arrays.parallelSort help, and what should you consider?",
        ["Arrays.parallelSort", "array", "threads"],
        `It sorts an array using parallel work. Example: Arrays.parallelSort(numbers);. It may help with large arrays.`,
        `Arrays.parallelSort can split a sufficiently large array across common-pool workers; Arrays.sort is simpler for small arrays. Both sort the original array. Measure with realistic data before claiming a speedup.`,
        `Parallel sorting adds coordination overhead and competes for shared CPU resources. Comparator work should be thread-safe and consistent; choose sequential sort for small arrays, latency-sensitive servers or when the common pool is busy.`),
    q(4, "Map", "medium", "What makes a safe key for a HashMap?",
        ["equals", "hashCode", "immutable"],
        `A map key needs stable equality and hash code. Example: String is a good key for Map<String,Integer> marks.`,
        `HashMap uses hashCode to find a bucket and equals to distinguish matching keys. Equal keys must have equal hash codes. If a key changes after insertion, lookup may fail; immutable String and record-like value objects are safer.`,
        `Override equals and hashCode together for custom key classes and base them on immutable fields. Example: a StudentId with final String value can safely key a map. HashMap allows one null key, but relying on null often complicates APIs.`),

    // Unit 5: exceptions, threads, I/O, serialization, regex, and desktop UI.
    q(5, "Exceptions", "easy", "What is the difference between checked and unchecked exceptions?",
        ["checked", "unchecked", "RuntimeException"],
        `Checked exceptions must be caught or declared; unchecked ones are RuntimeException types. Example: FileReader can throw IOException, while Integer.parseInt("x") throws NumberFormatException.`,
        `The compiler enforces handling of checked exceptions such as IOException. RuntimeException and its subclasses are unchecked; they often signal bad input or programming errors. Example: catch NumberFormatException when parsing a GUI text field.`,
        `Do not use checked versus unchecked as a proxy for severity. Catch at a layer that can recover or add useful context; avoid catch (Exception) that silently hides defects. A method can declare throws IOException so its caller decides how to recover.`),
    q(5, "Exceptions", "medium", "Explain try, catch, finally, throw, and throws.",
        ["try", "catch", "finally", "throw", "throws"],
        `try runs risky code; catch handles a failure; finally runs cleanup. throw creates an exception; throws declares one. Example: if (age < 0) throw new IllegalArgumentException("age");.`,
        `try { parse(); } catch (NumberFormatException ex) { showError(); } finally { logAttempt(); } handles parsing and always logs. throw new IllegalArgumentException(...) signals a failure; a method declaration throws IOException passes a checked exception to its caller.`,
        `finally usually runs even when try returns, but not in every process termination scenario. Do not return from finally because it can suppress a failure. Prefer try-with-resources to close AutoCloseable objects; catch only exceptions you can handle meaningfully.`),
    q(5, "Resources", "medium", "Why use try-with-resources for files and JDBC objects?",
        ["try-with-resources", "AutoCloseable", "close"],
        `It closes a resource automatically. Example: try (FileReader r = new FileReader("notes.txt")) { r.read(); }.`,
        `An AutoCloseable resource declared in try(...) is closed even when the body throws. Example: try (Connection con = DriverManager.getConnection(url, user, pass); PreparedStatement ps = con.prepareStatement(sql)) { ps.executeUpdate(); }.`,
        `Resources close in reverse declaration order. If both the body and close throw, the close failure is suppressed on the primary exception. Always close ResultSet, Statement and Connection or use nested try-with-resources, especially with connection pools.`),
    q(5, "Custom exceptions", "hard", "When should you define a custom exception?",
        ["exception", "domain", "message"],
        `Create one when callers need to recognize a specific failure. Example: InsufficientFundsException can tell a withdrawal caller what went wrong.`,
        `Use a named exception for a meaningful domain condition, such as class InsufficientFundsException extends Exception { InsufficientFundsException(String message) { super(message); } }. A withdrawal method can declare throws InsufficientFundsException and the UI can show an appropriate message.`,
        `Choose checked when a caller is expected to recover and the contract should require handling; choose unchecked for invariant or programming errors. Preserve the cause when wrapping: super("Payment failed", cause). Do not create a custom type for every trivial validation error.`),
    q(5, "Threads", "medium", "How can you start work in a Java thread?",
        ["Runnable", "Thread", "start"],
        `Put work in Runnable, then start a Thread. Example: new Thread(() -> System.out.println("Work")).start();.`,
        `Runnable separates the task from the thread: Runnable job = () -> doWork(); Thread t = new Thread(job); t.start();. Calling t.run() directly does not create a new thread. t.join() waits for completion.`,
        `For many tasks prefer an ExecutorService over creating unbounded threads: submit jobs to a fixed pool and shut it down. Shared mutable state needs synchronization or concurrent collections. In Swing, do long work off the event dispatch thread and update UI on it.`),
    q(5, "Concurrency", "hard", "What is a race condition, and how can Java prevent one?",
        ["race", "synchronized", "AtomicInteger"],
        `A race occurs when threads change shared data at the same time. Example: two threads doing count++ can lose an update; AtomicInteger.incrementAndGet() avoids that.`,
        `count++ reads, adds, then writes; those steps are not atomic. Use synchronized around a shared critical section or AtomicInteger for a simple counter. Example: private final AtomicInteger count = new AtomicInteger(); count.incrementAndGet();.`,
        `Synchronization also gives visibility guarantees, not just exclusion. volatile makes reads/writes visible but does not make count++ atomic. Prefer immutable messages, thread confinement, or concurrent data structures before hand-written locking; keep lock order consistent to avoid deadlock.`),
    q(5, "File I/O", "medium", "How do you read a text file safely in Java?",
        ["Files", "Path", "IOException"],
        `Use Files to read text. Example: List<String> lines = Files.readAllLines(Paths.get("notes.txt"), StandardCharsets.UTF_8); then handle IOException.`,
        `For Java 8, use Files.readAllLines(Paths.get("notes.txt"), StandardCharsets.UTF_8) or a BufferedReader in try-with-resources. Read line by line for large files, and catch or declare IOException.`,
        `Specify a charset; relying on a platform default can corrupt text. For huge files stream lines with try (Stream<String> lines = Files.lines(path, UTF_8)) { ... }. Be careful with untrusted paths and avoid reading an entire large file into memory.`),
    q(5, "Serialization", "medium", "What is Java object serialization and when should it be avoided?",
        ["Serializable", "ObjectOutputStream", "serialVersionUID"],
        `Serialization turns an object into bytes. Example: ObjectOutputStream can write a Serializable object to a file.`,
        `A class implements Serializable and can be written with ObjectOutputStream and read with ObjectInputStream. transient fields are skipped. Example: a session class might mark a password transient so it is not serialized.`,
        `Built-in Java serialization is fragile across class changes and unsafe for untrusted data because deserialization can execute gadget code. Prefer JSON or another explicit format for external interchange. If legacy serialization is required, restrict allowed classes and define serialVersionUID intentionally.`),
    q(5, "Regex", "medium", "How do Pattern and Matcher validate a text format?",
        ["Pattern", "Matcher", "matches"],
        String.raw`Regex checks whether text follows a pattern. Example: "1234".matches("\\d{4}") is true for four digits.`,
        String.raw`Compile a Pattern and use a Matcher: Pattern p = Pattern.compile("[A-Z]{2}\\d{3}"); boolean ok = p.matcher("AB123").matches();. matches checks the whole input; find searches for a matching part.`,
        String.raw`Java string literals need an extra backslash for regex escapes: "\\d" in source represents the regex \d. Regex is suitable for surface format checks, not full semantic validation. Example: a date pattern can match 2026-99-99, so parse it as a LocalDate too.`),
    q(5, "Enums", "easy", "What is an enum and how can it replace magic strings?",
        ["enum", "constant", "switch"],
        `An enum is a fixed set of named values. Example: enum Status { NEW, PAID, CANCELLED } prevents misspelling "PAID".`,
        `An enum is a type whose instances are predefined constants. Example: enum ConsumerType { RESIDENTIAL, COMMERCIAL }; a switch can choose a tariff from the type. It is safer than passing arbitrary strings.`,
        `Enums can have fields, constructors and methods, so behavior can live with each constant. Avoid storing enum ordinal numbers in a database because reordering constants changes their values; store explicit stable codes or names with migration planning.`),
    q(5, "Annotations", "medium", "What do @Override and other Java annotations do?",
        ["Override", "annotation", "compiler"],
        `Annotations add information to code. Example: @Override above a method asks the compiler to check that it really overrides a parent method.`,
        `@Override catches signature mistakes; @Deprecated marks an API as discouraged; @FunctionalInterface checks a single abstract method contract. Annotations can be read by tools or at runtime depending on their retention policy.`,
        `An annotation does not automatically implement behavior. Its @Retention controls whether it survives in source, class files or runtime, and @Target limits allowed locations. Frameworks can reflect on runtime annotations, but compile-time ones such as @Override are mainly for verification.`),
    q(5, "Swing", "medium", "What are JFrame, JLabel, JTextField, JButton, and ActionListener?",
        ["JFrame", "JTextField", "JButton", "ActionListener"],
        `JFrame is a window, JLabel displays text, JTextField accepts text, JButton is clicked, and ActionListener runs code on a click. Example: button.addActionListener(e -> label.setText("Done"));.`,
        `Swing builds desktop GUIs from components. A JFrame holds a JPanel with labels, text fields and buttons. Attach button.addActionListener(e -> calculate()) to process a click. Use a layout manager instead of fixed coordinates.`,
        `Create and update Swing components on the event dispatch thread with SwingUtilities.invokeLater. Keep business calculations in testable methods separate from click handlers. Long JDBC or file operations should run in a SwingWorker or other background task so the UI does not freeze.`),
    q(5, "Swing forms", "hard", "Implement the calculation logic for an electricity-bill Swing form.",
        ["units", "Math.min", "Math.max", "NumberFormatException"],
        `Read units, choose residential or commercial rates, and split usage at 100. Example: residential 150 units costs 100 × 1.50 + 50 × 2.00 = 250.`,
        `In the Calculate listener, parse units with Double.parseDouble(txtUnits.getText()), reject negatives, and require a selected radio button. Use first = Math.min(units,100) * firstRate and extra = Math.max(units-100,0) * extraRate; display first, extra and first+extra. Catch NumberFormatException and show JOptionPane feedback.`,
        `Assume Swing fields txtUnits/txtFirst/txtAbove/txtTotal and radio buttons rbResidential/rbCommercial. Example Calculate handler:
try {
  double units = Double.parseDouble(txtUnits.getText());
  if (!Double.isFinite(units) || units < 0) throw new IllegalArgumentException("Invalid units");
  if (!rbResidential.isSelected() && !rbCommercial.isSelected())
    throw new IllegalArgumentException("Choose a consumer type");
  double firstRate = rbResidential.isSelected() ? 1.50 : 2.00;
  double aboveRate = rbResidential.isSelected() ? 2.00 : 2.50;
  double first = Math.min(units,100) * firstRate;
  double above = Math.max(units-100,0) * aboveRate;
  txtFirst.setText(String.format("%.2f", first));
  txtAbove.setText(String.format("%.2f", above));
  txtTotal.setText(String.format("%.2f", first+above));
} catch (NumberFormatException ex) {
  JOptionPane.showMessageDialog(this,"Enter numeric units");
} catch (IllegalArgumentException ex) {
  JOptionPane.showMessageDialog(this,ex.getMessage());
}
Clear: set each text field to "0" and clear the ButtonGroup. Exit: dispose() for this window or System.exit(0) for a standalone app. Residential 150 units gives 150 + 100 = 250. For real billing use a documented rounding rule.`, "April 2025 Q6"),
    q(5, "Swing forms", "hard", "Implement Calculate, Clear, and Exit for a payroll Swing form.",
        ["gross", "allowance", "deduction", "net", "catch"],
        `Gross = hours × rate; allowance = 10% of gross; deduction = 5% of gross; net = gross + allowance - deduction. Example: 40 hours at 10 gives net 420. Clear empties fields; Exit closes the window.`,
        `In Calculate, parse hours and rate, reject negatives, compute gross = hours*rate, allowance = gross*0.10, deduction = gross*0.05, net = gross+allowance-deduction, then set output text. Catch NumberFormatException for invalid input. Clear sets all input/output fields to ""; Exit calls frame.dispose().`,
        `Assume Swing fields hoursField, rateField, grossField, allowanceField, deductionField and netField. Example Calculate handler:
try {
  double hours = Double.parseDouble(hoursField.getText());
  double rate = Double.parseDouble(rateField.getText());
  if (!Double.isFinite(hours) || !Double.isFinite(rate) || hours < 0 || rate < 0)
    throw new IllegalArgumentException("Invalid hours or rate");
  double gross = hours * rate, allowance = gross * 0.10, deduction = gross * 0.05;
  double net = gross + allowance - deduction;
  grossField.setText(String.format("%.2f",gross));
  allowanceField.setText(String.format("%.2f",allowance));
  deductionField.setText(String.format("%.2f",deduction));
  netField.setText(String.format("%.2f",net));
} catch (NumberFormatException ex) { JOptionPane.showMessageDialog(this,"Enter numbers"); }
  catch (IllegalArgumentException ex) { JOptionPane.showMessageDialog(this,ex.getMessage()); }
Clear sets all six text fields to ""; Exit calls dispose(). For 40 hours at 10, net = 420. Real payroll needs currency rounding and actual payroll rules.`, "November 2025 Q5"),
    q(5, "Swing forms", "hard", "Implement a purchase total form with VAT and a conditional discount.",
        ["quantity", "VAT", "discount", "grand"],
        `Total = price × quantity. VAT is 15% of total; discount is 5% if total exceeds 100. Grand price = total + VAT - discount.`,
        `Parse unit price and quantity; reject negatives. Compute subtotal = price*quantity, vat = subtotal*0.15, discount = subtotal > 100 ? subtotal*0.05 : 0, grand = subtotal+vat-discount. Display each result; catch NumberFormatException and clear all fields on Clear.`,
        `The paper says discount only when subtotal is strictly over 100. Example Calculate handler (fields priceField, quantityField, subtotalField, vatField, discountField, grandField):
try {
  double price = Double.parseDouble(priceField.getText());
  int quantity = Integer.parseInt(quantityField.getText());
  if (!Double.isFinite(price) || price < 0 || quantity < 0)
    throw new IllegalArgumentException("Invalid price or quantity");
  double subtotal = price * quantity;
  double vat = subtotal * 0.15;
  double discount = subtotal > 100 ? subtotal * 0.05 : 0;
  subtotalField.setText(String.format("%.2f",subtotal));
  vatField.setText(String.format("%.2f",vat));
  discountField.setText(String.format("%.2f",discount));
  grandField.setText(String.format("%.2f",subtotal+vat-discount));
} catch (NumberFormatException ex) { JOptionPane.showMessageDialog(this,"Enter valid numbers"); }
  catch (IllegalArgumentException ex) { JOptionPane.showMessageDialog(this,ex.getMessage()); }
Clear empties all fields; Exit calls dispose(). Price 25 × 5 gives grand 137.50. Real billing should define tax/discount order and use decimal money.`, "September 2024 Q5"),
    q(5, "Swing forms", "hard", "Implement a cash-or-credit discount form with three cash price bands.",
        ["cash", "credit", "discount", "boundary"],
        `Credit gives no discount. Cash below 1000 gets 2%, 1000 to 2000 gets 5%, and above 2000 gets 10%. Example: cash sale of 1000 gets 50 off, so 950 is due.`,
        `Read and validate sales >= 0 and the selected transaction type. Set rate = credit ? 0 : sales < 1000 ? 0.02 : sales <= 2000 ? 0.05 : 0.10; discount = sales*rate; due = sales-discount. Display both. Clear text/selection, and Exit closes the app.`,
        `Example Calculate handler (fields salesField, discountField, dueField; radio buttons cashButton, creditButton):
try {
  double sales = Double.parseDouble(salesField.getText());
  if (!Double.isFinite(sales) || sales < 0) throw new IllegalArgumentException("Invalid sales");
  if (!cashButton.isSelected() && !creditButton.isSelected())
    throw new IllegalArgumentException("Choose cash or credit");
  double rate = creditButton.isSelected() ? 0
      : sales < 1000 ? 0.02 : sales <= 2000 ? 0.05 : 0.10;
  double discount = sales * rate;
  discountField.setText(String.format("%.2f",discount));
  dueField.setText(String.format("%.2f",sales-discount));
} catch (NumberFormatException ex) { JOptionPane.showMessageDialog(this,"Enter numeric sales"); }
  catch (IllegalArgumentException ex) { JOptionPane.showMessageDialog(this,ex.getMessage()); }
Clear empties fields and radio selection; Exit calls dispose(). Test 999.99 at 2%, 1000 and 2000 at 5%, 2000.01 at 10%; credit is always 0%.`, "June 2026 Q5"),

    // Unit 6: JDBC architecture, CRUD, transactions, and GUI integration.
    q(6, "JDBC architecture", "easy", "What is JDBC and what are its main parts?",
        ["JDBC", "driver", "Connection", "Statement", "ResultSet"],
        `JDBC lets Java talk to a database. The driver connects Java to it; Connection opens a session; statements send SQL; ResultSet holds returned rows. Example: SELECT title FROM movie returns movie titles.`,
        `Java Database Connectivity is an API in java.sql. A JDBC driver translates calls to a database protocol. DriverManager or a DataSource provides Connection; PreparedStatement executes parameterized SQL; ResultSet reads SELECT rows.`,
        `Use a DataSource and connection pool in server applications to avoid opening a physical connection for every request. JDBC is synchronous and blocking; keep SQL off the Swing event dispatch thread. Transactions group multiple statements into one atomic unit.`),
    q(6, "Drivers", "medium", "What JDBC driver types exist, and which is normally used now?",
        ["Type 1", "Type 2", "Type 3", "Type 4"],
        `JDBC drivers are grouped into four types. Modern apps usually use Type 4, which talks directly to the database in Java. Example: MySQL Connector/J is a Type 4 driver.`,
        `Type 1 bridges ODBC; Type 2 uses native client code; Type 3 goes through middleware; Type 4 uses a database's wire protocol directly in Java. Add the database vendor's Type 4 driver JAR or dependency before opening a connection.`,
        `The historical four-type taxonomy explains portability and deployment tradeoffs. Type 4 is common for MySQL and PostgreSQL. Choose a maintained driver compatible with your JDK and database; do not assume a JDBC URL alone supplies the driver.`),
    q(6, "Connection", "medium", "How do you open and close a JDBC database connection?",
        ["DriverManager", "getConnection", "try-with-resources"],
        `Add the JDBC driver, then use DriverManager.getConnection(url, user, password). Close the connection after use. Example: try (Connection con = DriverManager.getConnection(url, user, pass)) { ... }.`,
        `The driver must be available to the app. Open a Connection with a JDBC URL and credentials, then use it inside try-with-resources; catch or declare SQLException. Example: jdbc:mysql://localhost:3306/moviedb needs a MySQL server and matching JDBC driver.`,
        `Production apps normally obtain pooled connections from a DataSource and keep credentials outside source code. Configure connection timeouts, use least-privilege accounts, and close pooled connections to return them to the pool. DriverManager is fine for a small exam example.`, "April 2025 Q5(a)"),
    q(6, "Prepared statements", "medium", "Why use PreparedStatement instead of building SQL with string concatenation?",
        ["PreparedStatement", "parameter", "SQL injection"],
        `PreparedStatement puts data into ? placeholders safely. Example: SELECT * FROM movie WHERE movie_id=?; then ps.setInt(1, id).`,
        `A PreparedStatement separates SQL structure from values: String sql = "SELECT title FROM movie WHERE movie_id=?"; try (PreparedStatement ps = con.prepareStatement(sql)) { ps.setInt(1,id); ... }. This prevents values from changing the query structure and handles quoting correctly.`,
        `Parameters cover values, not SQL identifiers such as table names; whitelist any dynamic identifiers. Prepared statements reduce SQL injection risk but still require authorization and validation. Do not concatenate user text into a WHERE clause even if it looks numeric.`),
    q(6, "CRUD", "medium", "Write a prepared INSERT for a movie record.",
        ["INSERT", "PreparedStatement", "setString", "executeUpdate"],
        `Use INSERT with five ? placeholders and fill them in order. Example: ps.setInt(1, 1); ps.setString(2, "Disaster holiday"); ps.executeUpdate();.`,
        `String sql = "INSERT INTO movie (movie_id,title,starring,genre,rating) VALUES (?,?,?,?,?)"; try (PreparedStatement ps = con.prepareStatement(sql)) { ps.setInt(1,1); ps.setString(2,"Disaster holiday"); ps.setString(3,"Kenneth Nkosi"); ps.setString(4,"comedy"); ps.setInt(5,5); ps.executeUpdate(); }.`,
        `executeUpdate returns affected row count; expect 1 for one inserted movie. Handle duplicate primary keys as SQLException and keep the insert in a transaction when paired with other writes. Avoid embedding credentials or user text in the SQL string.`, "April 2025 Q5(b)"),
    q(6, "CRUD", "medium", "How do you read rows with PreparedStatement and ResultSet?",
        ["SELECT", "executeQuery", "ResultSet", "next"],
        `Use executeQuery for SELECT, then call next() for each row. Example: while (rs.next()) System.out.println(rs.getString("title"));.`,
        `try (PreparedStatement ps = con.prepareStatement("SELECT title FROM movie WHERE rating >= ?")) { ps.setInt(1,4); try (ResultSet rs = ps.executeQuery()) { while (rs.next()) System.out.println(rs.getString("title")); } }. Column names should match the query.`,
        `ResultSet starts before the first row; next() advances and returns false at the end. Close it before its statement/connection. Select only needed columns, paginate large results, and map SQL NULL carefully: getInt returns 0 for NULL unless wasNull() is checked.`),
    q(6, "CRUD", "medium", "Write a prepared UPDATE without changing every row.",
        ["UPDATE", "WHERE", "executeUpdate"],
        `Use a WHERE condition on the key. Example: UPDATE movie SET title=? WHERE movie_id=?; then set title and id.`,
        `String sql = "UPDATE movie SET title=?, rating=? WHERE movie_id=?"; try (PreparedStatement ps = con.prepareStatement(sql)) { ps.setString(1,"New title"); ps.setInt(2,5); ps.setInt(3,1); int changed = ps.executeUpdate(); }. Check changed == 1.`,
        `Never omit WHERE for a single-row edit. If the primary key can change, decide whether to update it explicitly. For concurrent editors, add a version column and WHERE version=? to detect lost updates; affected row count 0 signals a conflict or missing row.`, "April 2025 Q5(b); September 2024 Q6; November 2025 Q6"),
    q(6, "CRUD", "medium", "Write a prepared DELETE for a selected record.",
        ["DELETE", "WHERE", "setString", "executeUpdate"],
        `Delete by its key, not by display position. Example: DELETE FROM booksTbl WHERE isbn=?; then ps.setString(1, selectedIsbn).`,
        `Use String sql = "DELETE FROM booksTbl WHERE isbn=?"; try (PreparedStatement ps = con.prepareStatement(sql)) { ps.setString(1, selectedIsbn); int removed = ps.executeUpdate(); }. A result of 1 means one row was removed.`,
        `Confirm user intent in a real UI, use a unique stable key and a WHERE clause, and check affected rows. A transaction may be needed if related records are deleted too. If audit history matters, use a documented soft-delete policy instead of physical deletion.`, "April 2025 Q5(b); September 2024 Q6; November 2025 Q6"),
    q(6, "Transactions", "hard", "How do you commit or roll back a multi-step JDBC transaction?",
        ["setAutoCommit", "commit", "rollback"],
        `Turn off auto-commit, run all related steps, then commit. If one fails, roll back. Example: moving money requires both a debit and a credit.`,
        `con.setAutoCommit(false); try { debit(con); credit(con); con.commit(); } catch (SQLException e) { con.rollback(); throw e; }. This keeps the transfer atomic. Use try-with-resources for the connection and statements.`,
        `Set isolation deliberately when concurrent transactions can interfere. Restore connection state before returning a pooled connection, ideally in finally; rollback failures should not hide the original error. A transfer also needs balance checks and concurrency control to avoid overdrafts or lost updates.`),
    q(6, "GUI and database", "hard", "How should a Swing form add, edit, and delete customer records through JDBC?",
        ["Swing", "PreparedStatement", "validation", "background"],
        `Read and validate the form, then use prepared INSERT, UPDATE, or DELETE statements keyed by customer ID. Example: UPDATE customerTbl SET firstname=? WHERE customer_id=? edits one customer.`,
        `For Add, bind customerId, firstName, surname, address and creditLimit to INSERT placeholders. For Edit, UPDATE ... WHERE customer_id=?; for Delete, DELETE ... WHERE customer_id=?. Clear resets fields; Exit disposes the window. Catch SQLException and show a useful message.`,
        `Run JDBC on a SwingWorker so the UI stays responsive, but publish UI updates on the event dispatch thread. Validate required fields and numeric credit limit, use prepared statements and try-with-resources, confirm destructive deletes, and check update counts. Store credentials outside code and use least-privilege DB access.`, "November 2025 Q6"),
    q(6, "JDBC case study", "hard", "How would you implement the library book CRUD task from a past paper?",
        ["ISBN", "INSERT", "UPDATE", "DELETE", "PreparedStatement"],
        `Use ISBN as the unique key. Example: DELETE FROM booksTbl WHERE isbn=? removes the selected book. Add uses INSERT; edit uses UPDATE with the same key.`,
        `For booksTbl(isbn,title,author,year,price), bind form values to INSERT INTO booksTbl (isbn,title,author,year,price) VALUES (?,?,?,?,?). UPDATE sets title/author/year/price WHERE isbn=?; DELETE uses WHERE isbn=?. Bind year with setInt and price according to the actual schema.`,
        `Assume an open Connection con and validated isbn, title, author, year, price variables. Example:
try (PreparedStatement ps = con.prepareStatement(
    "INSERT INTO booksTbl (isbn,title,author,year,price) VALUES (?,?,?,?,?)")) {
  ps.setString(1,isbn); ps.setString(2,title); ps.setString(3,author);
  ps.setInt(4,year); ps.setString(5,price); ps.executeUpdate();
}
try (PreparedStatement ps = con.prepareStatement(
    "UPDATE booksTbl SET title=?,author=?,year=?,price=? WHERE isbn=?")) {
  ps.setString(1,title); ps.setString(2,author); ps.setInt(3,year);
  ps.setString(4,price); ps.setString(5,isbn); ps.executeUpdate();
}
try (PreparedStatement ps = con.prepareStatement("DELETE FROM booksTbl WHERE isbn=?")) {
  ps.setString(1,isbn); ps.executeUpdate();
}
Clear resets form fields; Exit disposes the window. The paper lists price as String; production should normally use SQL DECIMAL and Java BigDecimal. Validate required fields and check affected-row counts.`, "September 2024 Q6"),
    q(6, "JDBC case study", "hard", "How would you implement the customer CRUD task from a past paper?",
        ["customer_id", "credit_limit", "INSERT", "UPDATE", "DELETE"],
        `Use customer ID as the key. Example: DELETE FROM customerTbl WHERE customer_id=? removes the selected customer. Bind all required fields for INSERT.`,
        `For customerTbl(customer_id, firstname, surname, address, credit_limit), INSERT five bound values with PreparedStatement. UPDATE firstname, surname, address and credit_limit WHERE customer_id=?; DELETE WHERE customer_id=?. Parse the numeric limit before binding.`,
        `Assume an open Connection con and validated id, first, last, address, limit variables. Example:
try (PreparedStatement ps = con.prepareStatement(
    "INSERT INTO customerTbl (customer_id,firstname,surname,address,credit_limit) VALUES (?,?,?,?,?)")) {
  ps.setString(1,id); ps.setString(2,first); ps.setString(3,last);
  ps.setString(4,address); ps.setDouble(5,limit); ps.executeUpdate();
}
try (PreparedStatement ps = con.prepareStatement(
    "UPDATE customerTbl SET firstname=?,surname=?,address=?,credit_limit=? WHERE customer_id=?")) {
  ps.setString(1,first); ps.setString(2,last); ps.setString(3,address);
  ps.setDouble(4,limit); ps.setString(5,id); ps.executeUpdate();
}
try (PreparedStatement ps = con.prepareStatement("DELETE FROM customerTbl WHERE customer_id=?")) {
  ps.setString(1,id); ps.executeUpdate();
}
Clear resets the form; Exit disposes it. Check affected-row counts, validate required fields and a nonnegative limit, and obtain a pooled connection from a configured DataSource in production.`, "November 2025 Q6"),
    q(6, "Database design", "medium", "Why should database money columns and Java monetary values use decimal types?",
        ["DECIMAL", "BigDecimal", "rounding"],
        `Money needs exact decimal arithmetic. Example: use SQL DECIMAL(12,2) and Java BigDecimal instead of double for an invoice total.`,
        `Binary floating-point can represent many decimal fractions only approximately. Store currency in a database DECIMAL column and calculate with BigDecimal, specifying scale and rounding. Example: new BigDecimal("0.10").add(new BigDecimal("0.20")) is exactly 0.30.`,
        `Use a defined currency, scale and rounding rule across persistence, calculations and display. Construct BigDecimal from a decimal string or BigDecimal.valueOf(double) when appropriate, not new BigDecimal(0.1). Database constraints should reject invalid ranges even when UI validation exists.`),
];
