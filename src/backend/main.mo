import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  type DailyRecord = {
    date : Text;
    actualSecondsWorked : Nat;
    payableHours : Nat;
    dailyEarnings : Nat;
    isPaidLeave : Bool;
  };

  let userRecords = Map.empty<Principal, Map.Map<Text, DailyRecord>>();

  func getUserRecordMap(user : Principal) : Map.Map<Text, DailyRecord> {
    switch (userRecords.get(user)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Text, DailyRecord>();
        userRecords.add(user, m);
        m;
      };
    };
  };

  func hoursToSeconds(hours : Nat) : Nat {
    hours * 60 * 60;
  };

  public shared ({ caller }) func saveDailyRecord(date : Text, additionalSecondsWorked : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save daily records");
    };

    let records = getUserRecordMap(caller);

    if (isPaidLeaveDay(records, date)) {
      Runtime.trap("Cannot modify a paid leave day. ");
    };

    let existingSeconds = switch (records.get(date)) {
      case (null) { 0 };
      case (?record) { record.actualSecondsWorked };
    };

    let totalSeconds = existingSeconds + additionalSecondsWorked;
    let payableHours = calculatePayableHours(totalSeconds);
    let dailyEarnings = payableHours * 64_10;
    let record = {
      date;
      actualSecondsWorked = totalSeconds;
      payableHours;
      dailyEarnings;
      isPaidLeave = false;
    };

    records.add(date, record);
  };

  func calculatePayableHours(actualSecondsWorked : Nat) : Nat {
    let minPayableSeconds = hoursToSeconds(5);
    let maxPayableSeconds = hoursToSeconds(6) - 1;
    if (actualSecondsWorked < minPayableSeconds) { 0 } else if (actualSecondsWorked <= maxPayableSeconds) {
      6;
    } else {
      actualSecondsWorked / 3600;
    };
  };

  func isPaidLeaveDay(records : Map.Map<Text, DailyRecord>, date : Text) : Bool {
    switch (records.get(date)) {
      case (null) { false };
      case (?record) { record.isPaidLeave };
    };
  };

  public shared ({ caller }) func applyPaidLeave(date : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can apply for paid leave");
    };
    let records = getUserRecordMap(caller);
    if (dailyRecordExists(records, date)) {
      Runtime.trap("A record already exists for this day. ");
    };

    if (getPaidLeaveCountForMonth(records, date) >= 2) {
      Runtime.trap("Limit of 2 paid leave days per month exceeded. ");
    };

    let record = {
      date;
      actualSecondsWorked = hoursToSeconds(6);
      payableHours = 6;
      dailyEarnings = 38460;
      isPaidLeave = true;
    };
    records.add(date, record);
  };

  func dailyRecordExists(records : Map.Map<Text, DailyRecord>, date : Text) : Bool {
    records.containsKey(date);
  };

  func getPaidLeaveCountForMonth(records : Map.Map<Text, DailyRecord>, targetMonth : Text) : Nat {
    records.values().toArray().foldLeft(
      0,
      func(count, record) {
        if (isSameMonth(record.date, targetMonth)) {
          count + (if (record.isPaidLeave) { 1 } else { 0 });
        } else { count };
      },
    );
  };

  func isSameMonth(date1 : Text, date2 : Text) : Bool {
    date1.startsWith(#text date2);
  };

  public shared ({ caller }) func resetMonthData(month : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can reset month data");
    };
    userRecords.forEach(
      func(_user, records) {
        let keysToRemove = List.empty<Text>();
        records.forEach(
          func(date, _) {
            if (isSameMonth(date, month)) {
              keysToRemove.add(date);
            };
          }
        );
        keysToRemove.values().forEach(
          func(date) {
            records.remove(date);
          }
        );
      }
    );
  };
};
